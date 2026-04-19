"use client";

import { useShareOrCopy } from "@/lib/use-share-or-copy";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { POP_IN } from "@/lib/motion";

/**
 * Share the current bot URL. Native share sheet on mobile (via
 * `navigator.share`), clipboard fallback elsewhere. Animation on
 * check-icon reuses the project-standard zoom-95 ease-out pattern.
 */
export function BotShareButton({ id }: { id: string }) {
  const [copied, share] = useShareOrCopy();

  const onClick = () => {
    if (typeof window === "undefined") return;
    share({
      url: window.location.href,
      title: `Pixabot ${id}`,
      text: `Check out pixabot ${id}`,
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Share"}
      data-tooltip={copied ? "Copied!" : "Share"}
      className="size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors duration-150 ease-out cursor-pointer"
    >
      <PixelIcon
        key={copied ? "copied" : "idle"}
        name={copied ? "check" : "copy"}
        className={`size-4 ${copied ? POP_IN : ""}`}
      />
    </button>
  );
}
