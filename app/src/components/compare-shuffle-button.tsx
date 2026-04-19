"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { randomId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";

/**
 * Generates six fresh random ids and navigates to
 * `/compare?ids=a,b,c,d,e,f`, preserving any palette params already on
 * the URL. Handy when the user lands on /compare with a known set and
 * wants a fresh lineup without typing.
 */
export function CompareShuffleButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shuffle = () => {
    const seen = new Set<string>();
    while (seen.size < 6) seen.add(randomId());
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("ids", [...seen].join(","));
    router.replace(`/compare?${qs.toString()}`, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={shuffle}
      aria-label="Compare six random pixabots"
      data-tooltip="Shuffle — six random pixabots"
      className="flex items-center gap-1 px-2 py-1 text-xs border border-border hover:bg-muted cursor-pointer"
    >
      <PixelIcon name="shuffle" className="size-3" />
      Shuffle
    </button>
  );
}
