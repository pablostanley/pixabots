"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidId, randomId } from "@pixabots/core";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeydown } from "@/lib/use-keydown";

type Action = {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const staticActions: Action[] = useMemo(
    () => [
      { id: "home", label: "Go to Create", hint: "/", keywords: ["home", "creator"], run: () => router.push("/") },
      { id: "browse", label: "Go to Browse", hint: "/browse", run: () => router.push("/browse") },
      { id: "favorites", label: "Go to Favorites", hint: "/favorites", keywords: ["stars", "saved"], run: () => router.push("/favorites") },
      { id: "docs", label: "Go to Docs", hint: "/docs", run: () => router.push("/docs") },
      { id: "api", label: "API reference", hint: "/docs/api", keywords: ["api", "rest"], run: () => router.push("/docs/api") },
      { id: "sdk", label: "SDK reference", hint: "/docs/sdk", run: () => router.push("/docs/sdk") },
      { id: "parts", label: "Parts catalog", hint: "/docs/parts", run: () => router.push("/docs/parts") },
      { id: "shortcuts", label: "Keyboard shortcuts", hint: "/docs/shortcuts", keywords: ["keys", "hotkeys"], run: () => router.push("/docs/shortcuts") },
      {
        id: "random",
        label: "Random pixabot",
        hint: "/bot/{id}",
        keywords: ["shuffle"],
        run: () => router.push(`/bot/${randomId()}`),
      },
      {
        id: "copy",
        label: "Copy current URL",
        keywords: ["share", "clipboard"],
        run: () => {
          navigator.clipboard.writeText(window.location.href);
        },
      },
    ],
    [router]
  );

  const actions: Action[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base: Action[] = [];

    // Jump-by-ID: if query looks like a 4-char base36 ID and is valid
    if (/^[0-9a-z]{4}$/i.test(trimmed) && isValidId(trimmed)) {
      base.push({
        id: `jump-${trimmed}`,
        label: `Open pixabot ${trimmed}`,
        hint: `/bot/${trimmed}`,
        run: () => router.push(`/bot/${trimmed}`),
      });
    }

    if (!trimmed) return [...base, ...staticActions];

    const filtered = staticActions.filter((a) => {
      const haystack = [a.label, a.hint, ...(a.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(trimmed);
    });
    return [...base, ...filtered];
  }, [query, staticActions, router]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  useKeydown(
    useCallback((e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setCursor(0);
      }
    }, [])
  );

  const run = (action: Action) => {
    action.run();
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, actions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (actions[cursor]) run(actions[cursor]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent aria-describedby={undefined} className="p-0 max-w-[520px]">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <input
          autoFocus
          placeholder="Jump to ID or search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onKey}
          className="w-full bg-transparent border-b border-border px-4 py-3 text-base font-mono outline-none placeholder:text-muted-foreground"
        />
        <ul className="max-h-[320px] overflow-y-auto py-2">
          {actions.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No matches.</li>
          )}
          {actions.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => run(a)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left cursor-pointer ${
                  i === cursor ? "bg-muted" : "bg-transparent"
                }`}
              >
                <span>{a.label}</span>
                {a.hint && <span className="font-mono text-xs text-muted-foreground">{a.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
