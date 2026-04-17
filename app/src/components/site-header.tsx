"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";

export function SiteHeader() {
  const [dark, setDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleTheme = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

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
    <header className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 h-12 border-b border-border text-sm">
      <Link href="/" className="font-bold text-lg tracking-wide hover:text-foreground transition-colors">
        Pixabots
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"}>
          <PixelIcon name={dark ? "lightbulb" : "moon"} className="size-4" />
        </Button>
        {navLink("/", "create")}
        {navLink("/docs", "docs")}
        {navLink("/docs/api", "api", "hidden sm:inline")}
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors">
          github
        </a>
      </nav>
    </header>
  );
}
