"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parsePastedId, usePaste } from "@/lib/use-paste";
import { botHref } from "@/lib/bot-href";

export function BotPasteNav({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  usePaste(
    useCallback(
      (e: ClipboardEvent) => {
        const candidate = parsePastedId(e);
        if (!candidate || candidate === id) return;
        e.preventDefault();
        router.replace(botHref(candidate, searchParams), { scroll: false });
      },
      [id, router, searchParams]
    )
  );

  return null;
}
