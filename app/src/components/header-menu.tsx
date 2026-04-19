"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useSfx } from "@/lib/use-sfx";
import { useTheme } from "@/lib/use-theme";

type Item = { href: string; label: string; external?: boolean };

const ITEMS: readonly Item[] = [
  { href: "/", label: "Create" },
  { href: "/browse", label: "Browse" },
  { href: "/favorites", label: "Stars" },
  { href: "/docs", label: "Docs" },
  { href: "/docs/api", label: "API" },
  { href: "https://github.com/pablostanley/pixabots", label: "GitHub", external: true },
];

/**
 * Mobile-only hamburger. Full nav + theme + sfx toggles open in a bottom
 * sheet (reusing the site Dialog component so animations/drag-to-dismiss
 * come for free). Hidden on ≥sm where the header has inline room.
 */
export function HeaderMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sfx = useSfx();
  const [dark, toggleTheme] = useTheme();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="sm:hidden size-8 flex items-center justify-center text-foreground cursor-pointer transition-[transform,color] duration-150 ease-out active:scale-[0.97]"
      >
        <PixelIcon name="menu" className="size-5" />
      </button>

      <DialogContent aria-describedby={undefined} className="sm:hidden">
        <DialogTitle className="text-sm uppercase tracking-wide text-muted-foreground">Menu</DialogTitle>
        <nav className="flex flex-col mt-3">
          {ITEMS.map((item) => {
            const active = !item.external && pathname === item.href;
            const base =
              "flex items-center py-3 px-2 border-b border-border text-base transition-colors";
            const color = active
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground";
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${base} ${color}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  <span aria-hidden="true" className="ml-auto text-xs">↗</span>
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${base} ${color}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={sfx.toggle}
            aria-pressed={sfx.enabled}
            className="flex-1 h-10 flex items-center justify-center gap-2 border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <span aria-hidden="true" className={`font-mono text-base ${sfx.enabled ? "" : "opacity-40 line-through"}`}>♪</span>
            <span className="text-sm">{sfx.enabled ? "Sound on" : "Sound off"}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-1 h-10 flex items-center justify-center gap-2 border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <PixelIcon name={dark ? "lightbulb" : "moon"} className="size-4" />
            <span className="text-sm">{dark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
