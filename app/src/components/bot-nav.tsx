"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { isValidId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { usePaste } from "@/lib/use-paste";
import { nextId, prevId } from "@/lib/bot-nav";

export function BotNav({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const go = useCallback(
    (target: string) => {
      const qs = searchParams?.toString();
      router.replace(`/bot/${target}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  useKeydown(
    useCallback(
      (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(prevId(id));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(nextId(id));
        }
      },
      [id, go]
    )
  );

  // Paste a pixabot URL or bare 4-char ID to jump to it.
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
        go(candidate);
      },
      [id, go]
    )
  );

  const btn =
    "size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(prevId(id))}
        className={btn}
        aria-label="Previous pixabot"
        data-tooltip="Previous (←)"
      >
        <PixelIcon name="chevron-right" className="size-4 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(nextId(id))}
        className={btn}
        aria-label="Next pixabot"
        data-tooltip="Next (→)"
      >
        <PixelIcon name="chevron-right" className="size-4" />
      </button>
    </div>
  );
}
