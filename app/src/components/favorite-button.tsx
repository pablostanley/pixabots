"use client";

import { useFavorites } from "@/lib/use-favorites";
import { POP_IN } from "@/lib/motion";

export function FavoriteButton({
  id,
  className,
  size = "md",
}: {
  id: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle } = useFavorites();
  const starred = has(id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={starred}
      aria-label={starred ? "Unfavorite" : "Favorite"}
      data-tooltip={starred ? "Remove from favorites" : "Add to favorites"}
      className={`shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer ${
        size === "sm" ? "size-6 text-sm" : "size-8 text-base"
      } ${starred ? "text-foreground" : "text-muted-foreground"} ${className ?? ""}`}
    >
      <span
        key={starred ? "on" : "off"}
        aria-hidden="true"
        className={`${starred ? "${POP_IN}" : ""} leading-none`}
      >
        {starred ? "★" : "☆"}
      </span>
    </button>
  );
}
