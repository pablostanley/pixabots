"use client";

import { useState, useRef, useCallback } from "react";
import { useKeydown } from "@/lib/use-keydown";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { encode, decode, isValidId, randomCombo, ANIM_FRAMES, FRAME_MS, type AnimFrame } from "@pixabots/core";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

const SIZES = [240, 480, 960, 1920] as const;
const DISPLAY = 480;
const NATIVE = 32;
const PX = DISPLAY / NATIVE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawOnCanvas(
  canvas: HTMLCanvasElement,
  images: Record<string, HTMLImageElement>,
  offsets?: AnimFrame
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, DISPLAY, DISPLAY);
  ctx.imageSmoothingEnabled = false;

  for (const category of layerOrder) {
    const img = images[category];
    if (!img) return;
    const yOffset = offsets ? offsets[category as keyof AnimFrame] * PX : 0;

    if (category === "body" && yOffset > 0) {
      ctx.drawImage(img, 0, NATIVE - 1, NATIVE, 1, 0, DISPLAY - PX, DISPLAY, PX);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, DISPLAY, DISPLAY - PX);
      ctx.clip();
      ctx.drawImage(img, 0, 0, NATIVE, NATIVE - 1, 0, yOffset, DISPLAY, (NATIVE - 1) * PX);
      ctx.restore();
    } else {
      ctx.drawImage(img, 0, yOffset, DISPLAY, DISPLAY);
    }
  }
}

export function Creator({ initialId }: { initialId: string | null }) {
  const [selection, setSelection] = useState(() => {
    if (initialId && isValidId(initialId)) return decode(initialId);
    return randomCombo();
  });
  const [animating, setAnimating] = useState(true);
  const [copied, copy] = useCopyToClipboard();

  const pixabotId = encode(selection);
  const apiUrl = `/api/pixabot/${pixabotId}`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const frameRef = useRef(0);
  const genRef = useRef(0);
  const selRef = useRef(selection);
  const mountedRef = useRef(false);
  const animatingRef = useRef(true);

  async function loadAndDraw(sel: Record<PartCategory, number>) {
    const gen = ++genRef.current;
    const loaded: Record<string, HTMLImageElement> = {};
    for (const cat of layerOrder) {
      loaded[cat] = await loadImage(parts[cat][sel[cat]].src);
    }
    if (gen !== genRef.current) return;
    imagesRef.current = loaded;
    if (!canvasRef.current) return;
    if (intervalRef.current) return; // animation running — will pick up new images next tick
    if (animatingRef.current) {
      startAnimation();
    } else {
      drawOnCanvas(canvasRef.current, loaded);
    }
  }

  function startAnimation() {
    if (intervalRef.current) return;
    frameRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (canvasRef.current) {
        drawOnCanvas(canvasRef.current, imagesRef.current, ANIM_FRAMES[frameRef.current]);
        frameRef.current = (frameRef.current + 1) % ANIM_FRAMES.length;
      }
    }, FRAME_MS);
    animatingRef.current = true;
    setAnimating(true);
  }

  function stopAnimation() {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    frameRef.current = 0;
    if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current);
    animatingRef.current = false;
    setAnimating(false);
  }

  function setCanvasRef(node: HTMLCanvasElement | null) {
    canvasRef.current = node;
    if (node && !mountedRef.current) {
      mountedRef.current = true;
      loadAndDraw(selRef.current);
    }
  }

  function updateSelection(next: Record<PartCategory, number>) {
    selRef.current = next;
    setSelection(next);
    loadAndDraw(next);
    const nextId = encode(next);
    window.history.replaceState(null, "", `/?id=${nextId}`);
  }

  const cycle = (category: PartCategory) => {
    const prev = selRef.current;
    updateSelection({
      ...prev,
      [category]: (prev[category] + 1) % parts[category].length,
    });
  };

  const pick = (category: PartCategory, index: number) => {
    updateSelection({ ...selRef.current, [category]: index });
  };

  const shuffle = () => updateSelection(randomCombo());

  const copyShareUrl = () => {
    copy(`${window.location.origin}/?id=${pixabotId}`);
  };

  const toggleAnimation = () => {
    if (intervalRef.current) stopAnimation();
    else startAnimation();
  };

  const download = async (size: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    for (const category of layerOrder) {
      const img = imagesRef.current[category];
      if (img) ctx.drawImage(img, 0, 0, size, size);
    }
    const link = document.createElement("a");
    link.download = `pixabot-${size}x${size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Empty deps is safe — cycle/shuffle/toggleAnimation all use refs internally
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.key) {
      case " ":
        e.preventDefault();
        updateSelection(randomCombo());
        break;
      case "p":
        toggleAnimation();
        break;
      case "ArrowRight":
        e.preventDefault();
        cycle(layerOrder[0]);
        break;
      case "ArrowLeft":
        e.preventDefault();
        cycle(layerOrder[1]);
        break;
      case "ArrowUp":
        e.preventDefault();
        cycle(layerOrder[2]);
        break;
      case "ArrowDown":
        e.preventDefault();
        cycle(layerOrder[3]);
        break;
    }
  }, []);

  useKeydown(handleKeyDown);

  return (
    <main className="flex flex-col items-center justify-center flex-1 gap-3 p-4 sm:gap-4 sm:p-6">
      {/* Toolbar */}
      <div className="flex items-center gap-2 w-full max-w-[504px]">
        <span className="text-lg font-bold mr-auto">Create</span>
        <Button
          variant="outline"
          size="lg"
          onClick={toggleAnimation}
          className={`text-sm gap-2 ${animating ? "bg-foreground/10" : ""}`}
        >
          <PixelIcon name={animating ? "stop" : "play"} className="size-4" />
          <span className="hidden sm:inline">{animating ? "Stop" : "Play"}</span>
        </Button>
        <Button variant="outline" size="lg" onClick={shuffle} className="text-sm gap-2">
          <PixelIcon name="shuffle" className="size-4" />
          <span className="hidden sm:inline">Shuffle</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="text-sm gap-2">
              <PixelIcon name="download" className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SIZES.map((size) => (
              <DropdownMenuItem key={size} onClick={() => download(size)} className="text-sm">
                {size} x {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Canvas */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="border border-border p-2 sm:p-3 cursor-pointer active:scale-[0.98] transition-transform w-full max-w-[504px]" onClick={shuffle}>
            <canvas
              ref={setCanvasRef}
              width={DISPLAY}
              height={DISPLAY}
              className="block w-full h-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="text-sm">Download</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {SIZES.map((size) => (
                <ContextMenuItem key={size} onClick={() => download(size)} className="text-sm">
                  {size} x {size}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={shuffle} className="text-sm">Shuffle</ContextMenuItem>
          <ContextMenuItem onClick={toggleAnimation} className="text-sm">{animating ? "Stop" : "Play"}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Part selectors — 2x2 on mobile, 4 in a row on desktop */}
      <div className="grid grid-cols-2 sm:flex gap-1 w-full max-w-[504px]">
        {layerOrder.map((category) => (
          <div key={category} className="flex flex-1 min-w-0">
            <Button variant="outline" size="lg" onClick={() => cycle(category)} className="rounded-none border-r-0 flex-1 text-sm">
              {layerLabel[category]}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-lg" className="rounded-none shrink-0 text-muted-foreground">
                  <PixelIcon name="chevron-down" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {parts[category].map((option, i) => (
                  <DropdownMenuItem key={option.name} onClick={() => pick(category, i)} className={`text-sm ${i === selection[category] ? "bg-accent" : ""}`}>
                    {option.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* ID bar */}
      <div className="border border-border px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2 text-sm w-full max-w-[504px]">
        <span className="font-mono text-foreground">{pixabotId}</span>
        <button onClick={copyShareUrl} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
          <PixelIcon
            key={copied ? "copied" : "idle"}
            name={copied ? "check" : "copy"}
            className={`size-4 ${copied ? "animate-in zoom-in-50 fade-in-0 duration-200" : ""}`}
          />
          <span
            key={copied ? "c" : "i"}
            className={`${copied ? "text-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-200" : ""}`}
          >
            {copied ? "Copied!" : "Share"}
          </span>
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            PNG
          </a>
          <a href={`${apiUrl}?animated=true`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            GIF
          </a>
          <a href={`${apiUrl}?format=json`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            JSON
          </a>
        </div>
      </div>
    </main>
  );
}
