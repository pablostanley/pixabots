"use client";

import { useRouter, usePathname } from "next/navigation";
import { PixelIcon } from "@/components/ui/pixel-icon";

/**
 * Small button that re-rolls `hue`+`saturate` on the current URL. Used on
 * bot detail. Keeps saturation in a useful range (0.6–1.4) so the bot
 * stays recognizable — matches the skew in the creator's randomPalette.
 */
export function PaletteShuffleButton() {
  const router = useRouter();
  const pathname = usePathname();

  const shuffle = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturate = Number((0.6 + Math.random() * 0.8).toFixed(2));
    const qs = new URLSearchParams();
    qs.set("hue", String(hue));
    qs.set("saturate", saturate.toFixed(2));
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={shuffle}
      aria-label="Shuffle palette"
      data-tooltip="Shuffle palette"
      className="size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
    >
      <PixelIcon name="shuffle" className="size-4" />
    </button>
  );
}
