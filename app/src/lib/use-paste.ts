"use client";

import { useRef, useSyncExternalStore } from "react";

/**
 * Subscribe to window `paste` events without useEffect. Mirrors useKeydown.
 */
export function usePaste(handler: (e: ClipboardEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useSyncExternalStore(
    (notify) => {
      const fn = (e: ClipboardEvent) => handlerRef.current(e);
      window.addEventListener("paste", fn);
      void notify;
      return () => window.removeEventListener("paste", fn);
    },
    () => null,
    () => null
  );
}
