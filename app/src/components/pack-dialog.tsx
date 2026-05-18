"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const EVENT = "open-pack-dialog";

export function openPackDialog() {
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Mounted once in the root layout. Any header button dispatches the
 * `open-pack-dialog` event via `openPackDialog()` and the modal opens
 * in place — no prop drilling, no global store.
 */
export function PackDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle className="text-base uppercase tracking-wide text-muted-foreground">
          Free pack
        </DialogTitle>
        <DialogDescription className="sr-only">
          2,000 pixel characters as PNG, GIF, and WebP.
        </DialogDescription>

        <div className="mt-2 flex flex-col gap-4">
          <a
            href="https://pablostanley.gumroad.com/l/pixabots"
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden border border-border bg-muted"
          >
            <img
              src="https://public-files.gumroad.com/gxs3g6uqux6013yvj6qs7v37jie3"
              alt="Pixabots free pack"
              className="block w-full h-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </a>

          <div className="text-sm leading-relaxed text-foreground">
            <p className="text-lg font-semibold mb-2">2,000 pixel characters. Free.</p>
            <p className="text-muted-foreground">
              A pack of 2,000 curated pixabots ready to drop into anything &mdash; PNGs at
              four sizes (240/480/960/1920), animated GIFs, and animated WebPs.
              Personal and commercial use.
            </p>
          </div>

          <ul className="text-sm text-muted-foreground flex flex-col gap-1">
            <li>2,000 unique characters</li>
            <li>12,000 files total</li>
            <li>PNG · GIF · WebP</li>
            <li>Free for personal + commercial use</li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <a
              href="https://pablostanley.gumroad.com/l/pixabots"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center h-11 px-4 bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Get the pack on Gumroad &rarr;
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="sm:flex-none inline-flex items-center justify-center h-11 px-4 border border-border hover:bg-muted transition-colors cursor-pointer text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
