"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeydown } from "@/lib/use-keydown";

type Shortcut = { keys: string[]; label: string };

const GLOBAL: Shortcut[] = [
  { keys: ["?"], label: "Show this help" },
];

const CREATOR: Shortcut[] = [
  { keys: ["Space"], label: "Shuffle" },
  { keys: ["P"], label: "Play / Stop animation" },
  { keys: ["C"], label: "Copy share URL" },
  { keys: ["← →"], label: "Cycle face / heads" },
  { keys: ["↑ ↓"], label: "Cycle body / top" },
];

const BOT: Shortcut[] = [
  { keys: ["←"], label: "Previous pixabot" },
  { keys: ["→"], label: "Next pixabot" },
  { keys: ["Esc"], label: "Close dialog (on browse)" },
];

function Section({ title, items }: { title: string; items: Shortcut[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {items.map((s) => (
          <div key={s.label} className="contents">
            <dt className="font-mono text-foreground">{s.keys.join(" ")}</dt>
            <dd className="text-muted-foreground">{s.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useKeydown(
    useCallback((e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }, [])
  );

  const onCreator = pathname === "/";
  const onBot = pathname?.startsWith("/bot/") || pathname === "/browse";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <div className="flex flex-col gap-5 mt-3">
          <Section title="Global" items={GLOBAL} />
          {onCreator && <Section title="Creator" items={CREATOR} />}
          {onBot && <Section title="Bot pages" items={BOT} />}
          {!onCreator && !onBot && (
            <>
              <Section title="Creator (/)" items={CREATOR} />
              <Section title="Bot pages (/bot, /browse)" items={BOT} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
