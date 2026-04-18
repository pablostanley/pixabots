"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PixelIcon } from "@/components/ui/pixel-icon";

export function GalleryDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Fullscreen gallery"
        data-tooltip="Gallery"
        className="size-8 shrink-0 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
      >
        <PixelIcon name="play" className="size-3.5" />
      </button>

      <DialogContent
        aria-describedby={undefined}
        className="max-w-none w-screen max-h-none h-dvh sm:max-w-none sm:max-h-none sm:inset-0 sm:left-0 sm:top-0 sm:translate-x-0 sm:translate-y-0 sm:p-0 p-0 inset-0 bg-background border-0"
      >
        <DialogTitle className="sr-only">Pixabot {id} gallery</DialogTitle>
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <picture>
              <source
                media="(prefers-reduced-motion: reduce)"
                srcSet={`/api/pixabot/${id}?size=960`}
              />
              <img
                src={`/api/pixabot/${id}?size=960&animated=true`}
                alt={`Pixabot ${id}`}
                width={960}
                height={960}
                className="block max-w-full max-h-full w-auto h-auto"
                style={{ imageRendering: "pixelated" }}
              />
            </picture>
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3 sm:p-4">
            <span className="font-mono text-lg font-bold mr-auto">{id}</span>
            <Link
              href={`/?id=${id}`}
              className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-muted text-sm"
            >
              <PixelIcon name="pen-square" className="size-4" />
              Edit
            </Link>
            <a
              href={`/api/pixabot/${id}?size=1920`}
              download={`pixabot-${id}-1920.png`}
              className="flex items-center gap-2 px-3 py-1.5 border border-border hover:bg-muted text-sm"
            >
              <PixelIcon name="download" className="size-4" />
              Get PNG
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
