"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

/**
 * Online connectivity for money/plan mutation fail-closed (AC-018 / BR-15).
 * Server snapshot assumes online to avoid disabling primary chrome during SSR.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useOnlineStatusClient(): { online: boolean; ready: boolean } {
  const online = useOnlineStatus();
  // Client store is ready immediately after hydration via useSyncExternalStore.
  return { online, ready: true };
}
