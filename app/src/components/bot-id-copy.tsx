"use client";

import { useState } from "react";

/**
 * Click the big pixabot ID on the detail page to copy it to the clipboard.
 * Shows a brief "copied" label for ~1.5s as feedback.
 */
export function BotIdCopy({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API blocked — silently no-op.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ID ${id}`}
      data-tooltip={copied ? "Copied!" : "Click to copy"}
      className="text-3xl font-bold font-mono leading-none text-left cursor-pointer relative"
    >
      {copied ? (
        <span className="motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in-0 motion-safe:duration-200">
          copied
        </span>
      ) : (
        id
      )}
    </button>
  );
}
