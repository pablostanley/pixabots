"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/embed/")) return null;

  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 py-3 text-sm text-muted-foreground">
      <span>
        <span className="font-mono text-foreground">9,856</span> combos ·{" "}
        <kbd className="font-mono border border-border px-1">SPACE</kbd> to shuffle ·{" "}
        <kbd className="font-mono border border-border px-1">?</kbd> for shortcuts ·{" "}
        <Link href="/random" className="hover:text-foreground transition-colors underline decoration-dotted underline-offset-2">
          surprise me
        </Link>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        by{" "}
        <a
          href="https://x.com/pablostanley"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          pablo stanley
        </a>
      </span>
    </footer>
  );
}
