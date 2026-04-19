import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/lib/source";

/**
 * Docs get DM Sans for body prose — Pixelify Sans is fun on the product
 * but hard to read at body size. Headings stay pixelated via the
 * `font-pixel` utility in globals.css for the docs block.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-root">
      <DocsLayout
        tree={source.pageTree}
        nav={{ enabled: false }}
        sidebar={{ collapsible: false }}
        themeSwitch={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
