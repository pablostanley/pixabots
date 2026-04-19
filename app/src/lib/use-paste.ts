"use client";

import { useSyncExternalStore } from "react";
import { isValidId } from "@pixabots/core";
import { isTypingTarget } from "@/lib/use-keydown";

/**
 * Subscribe to window `paste` events without useEffect. Mirrors useKeydown —
 * callers should wrap `handler` with useCallback so the subscribe identity
 * is stable across renders.
 */
export function usePaste(handler: (e: ClipboardEvent) => void) {
  useSyncExternalStore(
    (notify) => {
      window.addEventListener("paste", handler);
      void notify;
      return () => window.removeEventListener("paste", handler);
    },
    () => null,
    () => null
  );
  void handler;
}

/**
 * Extract a valid 4-char pixabot id from a clipboard paste. Accepts bare
 * ids, `?id=…`, `/bot/…`, and full URLs. Returns null when the target
 * is a form field (don't hijack regular paste) or the payload has no
 * valid id. Shared by the creator and BotPasteNav.
 */
export function parsePastedId(e: ClipboardEvent): string | null {
  if (isTypingTarget(e.target)) return null;
  const raw = e.clipboardData?.getData("text")?.trim();
  if (!raw) return null;
  const match = raw.match(/(?:^|[/=])([0-9a-z]{4})(?:[?&/#]|$)/i);
  const candidate = match?.[1]?.toLowerCase();
  return candidate && isValidId(candidate) ? candidate : null;
}
