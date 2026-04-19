"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { HeaderMenu } from "@/components/header-menu";
import { hasModifier, isTypingTarget, useKeydown } from "@/lib/use-keydown";
import { useScrollDirection } from "@/lib/use-scroll-direction";
import { useTheme } from "@/lib/use-theme";
import { useSfx } from "@/lib/use-sfx";

export function SiteHeader() {
  const pathname = usePathname();
  const { direction, scrolled } = useScrollDirection();
  const hide = scrolled && direction === "down";
  const [dark, toggleTheme] = useTheme();
  const sfx = useSfx();
  useKeydown(
    useCallback(
      (e: KeyboardEvent) => {
        if (isTypingTarget(e.target)) return;
        if (hasModifier(e)) return;
        if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          sfx.toggle();
        } else if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          toggleTheme();
        }
      },
      [sfx, toggleTheme]
    )
  );
  if (pathname?.startsWith("/embed/")) return null;

  const navLink = (href: string, label: string, className?: string) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`transition-colors ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"} ${className ?? ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 flex items-center gap-2 sm:gap-4 px-4 sm:px-6 h-12 border-b border-border text-sm transition-[transform,backdrop-filter,background-color] duration-200 motion-reduce:transition-none ${
        hide ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "backdrop-blur bg-background/80" : "bg-background"}`}
    >
      <Link href="/" className="font-bold text-lg tracking-wide hover:text-foreground transition-colors">
        Pixabots
      </Link>
      <nav className="hidden sm:flex items-center gap-4 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={sfx.toggle}
          aria-pressed={sfx.enabled}
          aria-label={sfx.enabled ? "Sound on — click to mute" : "Sound off — click to enable"}
          data-tooltip={sfx.enabled ? "Sound on" : "Sound off"}
        >
          <span aria-hidden="true" className={`font-mono text-sm ${sfx.enabled ? "" : "opacity-40 line-through"}`}>
            ♪
          </span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Light mode" : "Dark mode"} data-tooltip={dark ? "Light mode" : "Dark mode"}>
          <PixelIcon name={dark ? "lightbulb" : "moon"} className="size-4" />
        </Button>
        {navLink("/", "create")}
        {navLink("/browse", "browse")}
        {navLink("/favorites", "stars")}
        {navLink("/docs", "docs")}
        {navLink("/docs/api", "api")}
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          github
        </a>
      </nav>
      <div className="ml-auto sm:hidden">
        <HeaderMenu />
      </div>
    </header>
  );
}
