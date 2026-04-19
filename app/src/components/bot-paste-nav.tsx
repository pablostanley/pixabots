"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidId } from "@pixabots/core";
import { usePaste } from "@/lib/use-paste";

/**
 * Invisible listener that jumps the bot page on clipboard paste. Handles
 * bare 4-char ids, `?id=…`, `/bot/…`, and full URLs. Palette query params
 * on the current URL are preserved on navigation.
 *
 * Split out from the (now-removed) inline BotNav arrows so paste-to-jump
 * still works on both `/bot/[id]` and the browse dialog while visible
 * arrow navigation lives only inside the dialog via <BotEdgeNav />.
 */
export function BotPasteNav({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  usePaste(
    useCallback(
      (e: ClipboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const raw = e.clipboardData?.getData("text")?.trim();
        if (!raw) return;
        const match = raw.match(/(?:^|[/=])([0-9a-z]{4})(?:[?&/#]|$)/i);
        const candidate = match?.[1]?.toLowerCase();
        if (!candidate || !isValidId(candidate) || candidate === id) return;
        e.preventDefault();
        const qs = searchParams?.toString();
        router.replace(`/bot/${candidate}${qs ? `?${qs}` : ""}`, { scroll: false });
      },
      [id, router, searchParams]
    )
  );

  return null;
}
