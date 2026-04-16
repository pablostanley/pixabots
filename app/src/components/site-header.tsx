import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-4 px-6 h-12 border-b border-border text-sm">
      <Link href="/" className="font-bold text-lg tracking-wide hover:text-foreground transition-colors">
        Pixabots
      </Link>
      <nav className="flex items-center gap-4 ml-auto">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          create
        </Link>
        <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
          docs
        </Link>
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          github
        </a>
      </nav>
    </header>
  );
}
