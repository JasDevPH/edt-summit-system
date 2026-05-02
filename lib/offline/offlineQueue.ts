// FILE: lib/offline/offlineQueue.ts
import {
  addPendingParticipant,
  getPendingByStatus,
  updatePendingStatus,
  deletePendingParticipant,
  getPendingParticipants,
  getPendingCountForEvent,
  PendingParticipant,
} from "./db";

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function resizeImageFile(file: File, maxPx = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export async function queueParticipant(
  eventId: string,
  formData: PendingParticipant["formData"],
  imageFiles: { qrCode: File | null }
): Promise<string> {
  const localId = generateLocalId();

  let qrCodeBase64: string | null = null;

  if (imageFiles.qrCode) {
    try {
      qrCodeBase64 = await resizeImageFile(imageFiles.qrCode);
    } catch {
      // If resize fails, skip the image rather than blocking the queue
    }
  }

  const record: PendingParticipant = {
    localId,
    eventId,
    formData,
    qrCodeBase64,
    paymentProofBase64: null,
    status: "pending",
    retryCount: 0,
    createdAt: Date.now(),
    errorMessage: null,
  };

  await addPendingParticipant(record);

  // Request background sync if supported (Chrome/Android)
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & {
        sync: { register(tag: string): Promise<void> };
      }).sync.register("sync-pending-participants");
    } catch {
      // Background sync not available — fallback handles it
    }
  }

  return localId;
}

export async function syncNow(token: string): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingByStatus("pending");
  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      await updatePendingStatus(record.localId, "syncing");

      // Upload images if present
      let qrCodeUrl: string | undefined;
      let paymentProofUrl: string | undefined;

      if (record.qrCodeBase64) {
        qrCodeUrl = await uploadBase64Image(record.qrCodeBase64, "qr-codes", token);
      }
      if (record.paymentProofBase64) {
        paymentProofUrl = await uploadBase64Image(
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
        await deletePendingParticipant(record.localId);
        synced++;
      } else if (response.status >= 400 && response.status < 500) {
        const data = await response.json().catch(() => ({}));
        await updatePendingStatus(
          record.localId,
          "failed",
          data.message || `HTTP ${response.status}`
        );
        failed++;
      } else {
        // 5xx — leave as pending for retry
        await updatePendingStatus(record.localId, "pending");
      }
    } catch {
      // Network error — leave as pending
      await updatePendingStatus(record.localId, "pending");
    }
  }

  return { synced, failed };
}

async function uploadBase64Image(
  base64: string,
  folder: string,
  token: string
): Promise<string | undefined> {
  const blob = base64ToBlob(base64);
  const formData = new FormData();
  formData.append("file", blob, "image.jpg");
  formData.append("folder", folder);
  formData.append("resourceType", "image");

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) return undefined;
  const data = await response.json();
  return data.success ? data.url : undefined;
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export { getPendingParticipants, getPendingCountForEvent };
