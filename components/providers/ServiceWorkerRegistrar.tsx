"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { showToast } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { syncNow } from "@/lib/offline/offlineQueue";

export function ServiceWorkerRegistrar() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  // Register SW and send token
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — not critical
    });
  }, []);

  // Send token to SW whenever it changes
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const sendToken = async () => {
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      if (!registration?.active) return;

      if (token) {
        registration.active.postMessage({ type: "SET_TOKEN", token });
      } else {
        registration.active.postMessage({ type: "CLEAR_TOKEN" });
      }
    };

    sendToken();
  }, [token]);

  // Listen for SW messages (sync results)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        queryClient.invalidateQueries({ queryKey: ["participants"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["event"] });
        dispatch(
          showToast({
            message: "Participant synced successfully!",
            type: "success",
          })
        );
      }

      if (event.data?.type === "SYNC_FAILED") {
        dispatch(
          showToast({
            message: event.data.message || "Failed to sync participant",
            type: "error",
          })
        );
      }

      if (event.data?.type === "AUTH_REQUIRED") {
        dispatch(logout());
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [queryClient, dispatch]);

  // iOS Safari fallback: sync when coming back online
  useEffect(() => {
    if (!token) return;

    const handleOnline = async () => {
      try {
        const { synced, failed } = await syncNow(token);
        if (synced > 0) {
          queryClient.invalidateQueries({ queryKey: ["participants"] });
          queryClient.invalidateQueries({ queryKey: ["events"] });
          queryClient.invalidateQueries({ queryKey: ["event"] });
          dispatch(
            showToast({
              message: `${synced} participant${synced !== 1 ? "s" : ""} synced!`,
              type: "success",
            })
          );
        }
        if (failed > 0) {
          dispatch(
            showToast({
              message: `${failed} participant${failed !== 1 ? "s" : ""} failed to sync`,
              type: "error",
            })
          );
        }
      } catch {
        // Sync error — will retry on next online event
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [token, queryClient, dispatch]);

  return null;
}
