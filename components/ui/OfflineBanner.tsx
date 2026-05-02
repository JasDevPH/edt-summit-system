// FILE: components/ui/OfflineBanner.tsx
"use client";

import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing } = useOfflineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:ml-64">
      <div
        className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium ${
          isSyncing
            ? "bg-blue-600 text-white"
            : isOnline && pendingCount > 0
            ? "bg-amber-500 text-white"
            : "bg-gray-800 text-white"
        }`}
      >
        {isSyncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Syncing {pendingCount} participant{pendingCount !== 1 ? "s" : ""}...</span>
          </>
        ) : isOnline && pendingCount > 0 ? (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{pendingCount} participant{pendingCount !== 1 ? "s" : ""} pending sync</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
            </svg>
            <span>
              You&apos;re offline
              {pendingCount > 0 && ` \u2022 ${pendingCount} participant${pendingCount !== 1 ? "s" : ""} pending sync`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
