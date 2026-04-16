export function SiteFooter() {
  return (
    <footer className="flex items-center gap-4 px-6 h-10 text-sm text-muted-foreground">
      <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
        github
      </a>
      <a href="/docs" className="hover:text-foreground transition-colors">
        docs
      </a>
      <span className="ml-auto">
        by{" "}
        <a href="https://x.com/pablostanley" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          pablo stanley
        </a>
      </span>
    </footer>
  );
}
