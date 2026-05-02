// FILE: hooks/useOfflineStatus.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingCountForEvent } from "@/lib/offline/offlineQueue";

export function useOfflineStatus(eventId?: string) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!eventId) return;
    try {
      const count = await getPendingCountForEvent(eventId);
      setPendingCount(count);
    } catch {
      // IDB not available (SSR guard)
    }
  }, [eventId]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setIsSyncing(false);
        refreshCount();
      }
      if (event.data?.type === "SYNC_FAILED") {
        setIsSyncing(false);
        refreshCount();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [refreshCount]);

  return { isOnline, pendingCount, isSyncing, refreshCount };
}
