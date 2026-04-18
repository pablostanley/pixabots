"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { SITE_URL } from "@/lib/constants";

type TabKey = "url" | "html" | "markdown" | "react";

const TABS: { key: TabKey; label: string }[] = [
  { key: "url", label: "URL" },
  { key: "html", label: "HTML" },
  { key: "markdown", label: "Markdown" },
  { key: "react", label: "React" },
];

function snippetFor(kind: TabKey, id: string): string {
  const url = `${SITE_URL}/api/pixabot/${id}?size=240`;
  const animated = `${SITE_URL}/api/pixabot/${id}?size=240&animated=true`;
  switch (kind) {
    case "url":
      return `${url}\n${animated}`;
    case "html":
      return `<img
  src="${animated}"
  alt="pixabot ${id}"
  width="240"
  height="240"
  style="image-rendering: pixelated"
/>`;
    case "markdown":
      return `![pixabot ${id}](${animated})`;
    case "react":
      return `<img
  src="${animated}"
  alt="pixabot ${id}"
  width={240}
  height={240}
  style={{ imageRendering: "pixelated" }}
/>`;
  }
}

export function BotEmbed({ id }: { id: string }) {
  const [tab, setTab] = useState<TabKey>("html");
  const [copied, setCopied] = useState(false);

  const snippet = snippetFor(tab, id);

  const onCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Embed</h3>
      <div role="tablist" aria-label="Embed format" className="flex flex-wrap gap-1">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm border border-border transition-colors cursor-pointer ${
                active ? "bg-muted text-foreground" : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="relative">
        <pre className="border border-border p-3 pr-12 text-xs font-mono whitespace-pre-wrap break-all overflow-auto max-h-60 bg-muted/30">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-2 right-2 size-8 flex items-center justify-center border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
          aria-label="Copy snippet"
          data-tooltip={copied ? "Copied!" : "Copy snippet"}
        >
          <PixelIcon
            key={copied ? "c" : "i"}
            name={copied ? "check" : "copy"}
            className={`size-4 ${copied ? "animate-in zoom-in-50 fade-in-0 duration-200" : ""}`}
          />
        </button>
      </div>
    </section>
  );
}
