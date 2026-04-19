"use client";

import { useRef, useSyncExternalStore } from "react";

/**
 * True when the event target is a form field where a key/paste should
 * behave normally (typing a character, pasting into the field) instead
 * of triggering a global shortcut.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

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
