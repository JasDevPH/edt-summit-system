// EDT Summit Service Worker — Offline-capable PWA
const SHELL_CACHE = "edt-shell-v1";
const API_CACHE = "edt-api-v1";
const IMAGE_CACHE = "edt-images-v1";
const DB_NAME = "edt-summit-offline";
const DB_VERSION = 1;

// ─── IndexedDB helpers (no idb library in SW context) ───────────────────────

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pendingParticipants")) {
        const store = db.createObjectStore("pendingParticipants", {
          keyPath: "localId",
        });
        store.createIndex("eventId", "eventId", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains("cachedEvents")) {
        db.createObjectStore("cachedEvents", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("authTokens")) {
        db.createObjectStore("authTokens", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAllByIndex(db, storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).index(indexName).getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve(req.result);
  });
}

function idbDelete(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(["/edt logo.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const validCaches = [SHELL_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !validCaches.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch routing ───────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET mutations or auth endpoints
  if (url.pathname.startsWith("/api/auth")) {
    return; // network-only
  }

  // GET /api/events* — network-first, cache fallback
  if (
    request.method === "GET" &&
    (url.pathname.startsWith("/api/events") ||
      url.pathname.startsWith("/api/participants"))
  ) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Cloudinary CDN images — cache-first
  if (url.hostname.includes("cloudinary.com") || url.hostname.includes("res.cloudinary")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Next.js static assets — cache-first (hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Navigation requests — network-first, fallback to shell cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ success: false, offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      caches.match("/") ||
      new Response("Offline", { status: 503 })
    );
  }
}

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-participants") {
    event.waitUntil(syncPendingParticipants());
  }
});

async function syncPendingParticipants() {
  let db;
  try {
    db = await openOfflineDB();
  } catch {
    return;
  }

  const tokenRecord = await idbGet(db, "authTokens", "jwt").catch(() => null);
  const token = tokenRecord?.value;
  if (!token) return;

  const pending = await idbGetAllByIndex(
    db,
    "pendingParticipants",
    "status",
    "pending"
  ).catch(() => []);

  for (const record of pending) {
    try {
      // Mark as syncing
      await idbPut(db, "pendingParticipants", { ...record, status: "syncing" });

      let qrCodeUrl;
      let paymentProofUrl;

      if (record.qrCodeBase64) {
        qrCodeUrl = await uploadBase64(record.qrCodeBase64, "qr-codes", token);
      }
      if (record.paymentProofBase64) {
        paymentProofUrl = await uploadBase64(
          record.paymentProofBase64,
          "payment-proofs",
          token
        );
      }

      const payload = {
        ...record.formData,
        eventId: record.eventId,
        ...(qrCodeUrl ? { qrCodeUrl } : {}),
        ...(paymentProofUrl ? { paymentProofUrl } : {}),
      };

      const response = await fetch("/api/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201 || response.status === 200) {
        await idbDelete(db, "pendingParticipants", record.localId);
        postToClients({ type: "SYNC_COMPLETE", localId: record.localId });
      } else if (response.status >= 400 && response.status < 500) {
        const data = await response.json().catch(() => ({}));
        await idbPut(db, "pendingParticipants", {
          ...record,
          status: "failed",
          retryCount: (record.retryCount || 0) + 1,
          errorMessage: data.message || `HTTP ${response.status}`,
        });
        postToClients({
          type: "SYNC_FAILED",
          localId: record.localId,
          message: data.message || "Sync failed",
        });
      } else {
        // 5xx — revert to pending for retry
        await idbPut(db, "pendingParticipants", { ...record, status: "pending" });
      }
    } catch {
      // Network error — revert to pending
      await idbPut(db, "pendingParticipants", {
        ...record,
        status: "pending",
      }).catch(() => {});
    }
  }
}

async function uploadBase64(base64, folder, token) {
  try {
    const [header, data] = base64.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });

    const form = new FormData();
    form.append("file", blob, "image.jpg");
    form.append("folder", folder);
    form.append("resourceType", "image");

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) return undefined;
    const json = await response.json();
    return json.success ? json.url : undefined;
  } catch {
    return undefined;
  }
}

function postToClients(message) {
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_TOKEN") {
    openOfflineDB()
      .then((db) =>
        idbPut(db, "authTokens", { key: "jwt", value: event.data.token })
      )
      .catch(() => {});
  }

  if (event.data?.type === "CLEAR_TOKEN") {
    openOfflineDB()
      .then((db) => idbDelete(db, "authTokens", "jwt"))
      .catch(() => {});
  }
});
