"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ShareData = { url: string; title?: string; text?: string };

export function useShareOrCopy(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const share = useCallback(
    async (data: ShareData) => {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        const canShare =
          typeof navigator.canShare === "function" ? navigator.canShare(data) : true;
        if (canShare) {
          try {
            await navigator.share(data);
            return "shared" as const;
          } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return "canceled" as const;
          }
        }
      }
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
      return "copied" as const;
    },
    [resetMs]
  );

  return [copied, share] as const;
}
