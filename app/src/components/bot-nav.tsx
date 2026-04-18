"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useKeydown } from "@/lib/use-keydown";
import { nextId, prevId } from "@/lib/bot-nav";

export function BotNav({ id }: { id: string }) {
  const router = useRouter();

  const go = useCallback(
    (target: string) => {
      router.replace(`/bot/${target}`, { scroll: false });
    },
    [router]
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

  const btn =
    "size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(prevId(id))}
        className={btn}
        aria-label="Previous pixabot"
        title="Previous (←)"
      >
        <PixelIcon name="chevron-right" className="size-4 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => go(nextId(id))}
        className={btn}
        aria-label="Next pixabot"
        title="Next (→)"
      >
        <PixelIcon name="chevron-right" className="size-4" />
      </button>
    </div>
  );
}
