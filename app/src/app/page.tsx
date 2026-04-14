"use client";

import { useState, useRef } from "react";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { Button } from "@/components/ui/button";
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
const W = DISPLAY + 24;

type AnimOffsets = Record<"top" | "heads" | "eyes" | "body", number>;

const ANIM_FRAMES: AnimOffsets[] = [
  { top: 0, heads: 0, eyes: 0, body: 0 },
  { top: 0, heads: 0, eyes: 0, body: 0 },
  { top: 0, heads: 1, eyes: 1, body: 0 },
  { top: 1, heads: 2, eyes: 2, body: 1 },
  { top: 2, heads: 2, eyes: 2, body: 1 },
  { top: 2.5, heads: 2, eyes: 2, body: 1 },
  { top: 2, heads: 1, eyes: 1, body: 1 },
  { top: 1, heads: 0, eyes: 0, body: 0 },
];

const FRAME_MS = 72;

function randomSelection(): Record<PartCategory, number> {
  return {
    eyes: Math.floor(Math.random() * parts.eyes.length),
    heads: Math.floor(Math.random() * parts.heads.length),
    body: Math.floor(Math.random() * parts.body.length),
    top: Math.floor(Math.random() * parts.top.length),
  };
}

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
  offsets?: AnimOffsets
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, DISPLAY, DISPLAY);
  ctx.imageSmoothingEnabled = false;

  for (const category of layerOrder) {
    const img = images[category];
    if (!img) return;
    const yOffset = offsets ? offsets[category as keyof AnimOffsets] * PX : 0;

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

export default function Home() {
  const [selection, setSelection] = useState(randomSelection);
  const [dark, setDark] = useState(true);
  const [animating, setAnimating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const frameRef = useRef(0);
  const genRef = useRef(0);
  const selRef = useRef(selection);
  const mountedRef = useRef(false);

  async function loadAndDraw(sel: Record<PartCategory, number>) {
    const gen = ++genRef.current;
    const loaded: Record<string, HTMLImageElement> = {};
    for (const cat of layerOrder) {
      loaded[cat] = await loadImage(parts[cat][sel[cat]].src);
    }
    if (gen !== genRef.current) return;
    imagesRef.current = loaded;
    if (canvasRef.current && !intervalRef.current) {
      drawOnCanvas(canvasRef.current, loaded);
    }
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

  const shuffle = () => updateSelection(randomSelection());

  const toggleTheme = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  const toggleAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
      frameRef.current = 0;
      if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current);
      setAnimating(false);
    } else {
      frameRef.current = 0;
      intervalRef.current = setInterval(() => {
        if (canvasRef.current) {
          drawOnCanvas(canvasRef.current, imagesRef.current, ANIM_FRAMES[frameRef.current]);
          frameRef.current = (frameRef.current + 1) % ANIM_FRAMES.length;
        }
      }, FRAME_MS);
      setAnimating(true);
    }
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

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh gap-4 p-6">
      <div className="flex items-center gap-3" style={{ width: W }}>
        <h1 className="text-2xl font-bold tracking-wide uppercase mr-auto">Pixabots</h1>
        <Button variant="outline" size="icon-lg" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"} className="text-2xl">
          {dark ? <span className="translate-y-[0.2em]">*</span> : "•"}
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={toggleAnimation}
          title={animating ? "Stop" : "Play"}
          className={`text-xl ${animating ? "bg-foreground/10" : ""}`}
        >
          {animating ? <span className="text-[10px]">■</span> : <span className="rotate-90">▲</span>}
        </Button>
        <Button variant="outline" size="icon-lg" onClick={shuffle} title="Shuffle" className="text-xl">
          ↔
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-lg" title="Download" className="text-xl">
              ↓
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

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="border border-border bg-card p-3 cursor-pointer active:scale-[0.98] transition-transform" onClick={shuffle}>
            <div className="checkerboard">
              <canvas
                ref={setCanvasRef}
                width={DISPLAY}
                height={DISPLAY}
                className="block"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
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

      <div className="flex gap-1" style={{ width: W }}>
        {layerOrder.map((category) => (
          <div key={category} className="flex flex-1 min-w-0">
            <Button variant="outline" size="lg" onClick={() => cycle(category)} className="rounded-none border-r-0 flex-1">
              {layerLabel[category]}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-lg" className="rounded-none shrink-0 text-muted-foreground">
                  <span className="rotate-180">▲</span>
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

      <div className="text-xs text-center" style={{ width: W }}>
        <a href="https://github.com/pablostanley/pixabots" target="_blank" rel="noopener noreferrer">github</a>
        {" · "}
        by <a href="https://x.com/pablostanley" target="_blank" rel="noopener noreferrer">pablo stanley</a>
      </div>
    </main>
  );
}
