// FILE: lib/offline/db.ts
import { openDB as idbOpenDB, IDBPDatabase } from "idb";

export interface PendingParticipant {
  localId: string;
  eventId: string;
  formData: {
    fullname: string;
    email?: string;
    phoneNumber?: string;
    homeAddress?: string;
    birthday?: string;
    yoroiAddress: string;
    mlkbankoAmount: number;
    registrationFee: number;
    registrationSource: string;
  };
  qrCodeBase64: string | null;
  paymentProofBase64: string | null;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  createdAt: number;
  errorMessage: string | null;
}

export interface CachedEvent {
  id: string;
  data: unknown;
  cachedAt: number;
}

export interface AuthToken {
  key: string;
  value: string;
}

interface EdtDB {
  pendingParticipants: {
    key: string;
    value: PendingParticipant;
    indexes: { eventId: string; status: string };
  };
  cachedEvents: {
    key: string;
    value: CachedEvent;
  };
  authTokens: {
    key: string;
    value: AuthToken;
  };
}

const DB_NAME = "edt-summit-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EdtDB>> | null = null;

function getDB(): Promise<IDBPDatabase<EdtDB>> {
  if (!dbPromise) {
    dbPromise = idbOpenDB<EdtDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // pendingParticipants store
        if (!db.objectStoreNames.contains("pendingParticipants")) {
          const store = db.createObjectStore("pendingParticipants", {
            keyPath: "localId",
          });
          store.createIndex("eventId", "eventId");
          store.createIndex("status", "status");
        }

        // cachedEvents store
        if (!db.objectStoreNames.contains("cachedEvents")) {
          db.createObjectStore("cachedEvents", { keyPath: "id" });
        }

        // authTokens store
        if (!db.objectStoreNames.contains("authTokens")) {
          db.createObjectStore("authTokens", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function addPendingParticipant(
  participant: PendingParticipant
): Promise<void> {
  const db = await getDB();
  await db.put("pendingParticipants", participant);
}

export async function getPendingParticipants(): Promise<PendingParticipant[]> {
  const db = await getDB();
  return db.getAll("pendingParticipants");
}

export async function getPendingByStatus(
  status: PendingParticipant["status"]
): Promise<PendingParticipant[]> {
  const db = await getDB();
  const index = db
    .transaction("pendingParticipants")
    .store.index("status");
  return index.getAll(status);
}

export async function updatePendingStatus(
  localId: string,
  status: PendingParticipant["status"],
  errorMessage?: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("pendingParticipants", "readwrite");
  const record = await tx.store.get(localId);
  if (record) {
    record.status = status;
    if (errorMessage !== undefined) record.errorMessage = errorMessage;
    if (status === "failed") record.retryCount = (record.retryCount || 0) + 1;
    await tx.store.put(record);
  }
  await tx.done;
}

export async function deletePendingParticipant(localId: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingParticipants", localId);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count("pendingParticipants");
}

export async function getPendingCountForEvent(eventId: string): Promise<number> {
  const db = await getDB();
  const index = db
    .transaction("pendingParticipants")
    .store.index("eventId");
  return index.count(eventId);
}

export async function cacheEvent(id: string, data: unknown): Promise<void> {
  const db = await getDB();
  await db.put("cachedEvents", { id, data, cachedAt: Date.now() });
}

export async function getCachedEvent(id: string): Promise<CachedEvent | undefined> {
  const db = await getDB();
  return db.get("cachedEvents", id);
}

export async function setAuthToken(token: string): Promise<void> {
  const db = await getDB();
  await db.put("authTokens", { key: "jwt", value: token });
}

export async function getAuthToken(): Promise<string | null> {
  const db = await getDB();
  const record = await db.get("authTokens", "jwt");
  return record?.value ?? null;
}

export async function deleteAuthToken(): Promise<void> {
  const db = await getDB();
  await db.delete("authTokens", "jwt");
}

export { getDB };
