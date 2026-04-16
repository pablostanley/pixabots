"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";

export function SiteHeader() {
  const [dark, setDark] = useState(true);

  const toggleTheme = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex items-center gap-4 px-6 h-12 border-b border-border text-sm">
      <Link href="/" className="font-bold text-lg tracking-wide hover:text-foreground transition-colors">
        Pixabots
      </Link>
      <nav className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"}>
          <PixelIcon name={dark ? "lightbulb" : "moon"} className="size-4" />
        </Button>
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          create
        </Link>
        <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
          docs
        </Link>
        <Link href="/docs/api" className="text-muted-foreground hover:text-foreground transition-colors">
          api
        </Link>
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          github
        </a>
      </nav>
    </header>
  );
}
