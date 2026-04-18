"use client";

import { useRef, useSyncExternalStore } from "react";

/**
 * Subscribe to window keydown events without useEffect.
 * Uses useSyncExternalStore — React's blessed pattern for external
 * subscriptions with proper mount/unmount lifecycle.
 */
export function useKeydown(handler: (e: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useSyncExternalStore(
    (notify) => {
      const fn = (e: KeyboardEvent) => handlerRef.current(e);
      window.addEventListener("keydown", fn);
      // notify is unused — we don't have a snapshot that changes
      void notify;
      return () => window.removeEventListener("keydown", fn);
    },
    () => null, // client snapshot (unused)
    () => null  // server snapshot (unused — no listener on server)
  );
}
