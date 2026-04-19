"use client";

import { useSyncExternalStore } from "react";

/**
 * True when the event target is a form field where a key/paste should
 * behave normally (typing a character, pasting into the field) instead
 * of triggering a global shortcut.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

/**
 * True when the key event carries a command / ctrl / alt modifier —
 * i.e. it's probably a browser or OS shortcut we shouldn't hijack.
 */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey;
}

/**
 * Subscribe to window keydown events without useEffect. Callers should
 * wrap `handler` with useCallback so the subscribe identity is stable
 * across renders — otherwise we re-attach the listener on each change.
 */
export function useKeydown(handler: (e: KeyboardEvent) => void) {
  useSyncExternalStore(
    (notify) => {
      window.addEventListener("keydown", handler);
      void notify;
      return () => window.removeEventListener("keydown", handler);
    },
    () => null,
    () => null
  );
  void handler;
}
