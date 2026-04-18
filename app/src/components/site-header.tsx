"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useScrollDirection } from "@/lib/use-scroll-direction";
import { useTheme } from "@/lib/use-theme";

export function SiteHeader() {
  const pathname = usePathname();
  const { direction, scrolled } = useScrollDirection();
  const hide = scrolled && direction === "down";
  const [dark, toggleTheme] = useTheme();

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
      <nav className="flex items-center gap-2 sm:gap-4 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"}>
          <PixelIcon name={dark ? "lightbulb" : "moon"} className="size-4" />
        </Button>
        {navLink("/", "create")}
        {navLink("/browse", "browse")}
        {navLink("/docs", "docs")}
        {navLink("/docs/api", "api", "hidden sm:inline")}
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
          github
        </a>
      </nav>
    </header>
  );
}
