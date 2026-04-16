"use client";

import { useState, useRef } from "react";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { encode, randomCombo, ANIM_FRAMES, FRAME_MS, type AnimFrame } from "@pixabots/core";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
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

export default function Home() {
  const [selection, setSelection] = useState(randomCombo);
  const [animating, setAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const pixabotId = encode(selection);
  const apiUrl = `/api/pixabot/${pixabotId}`;

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

  const pick = (category: PartCategory, index: number) => {
    updateSelection({ ...selRef.current, [category]: index });
  };

  const shuffle = () => updateSelection(randomCombo());

  const copyApiUrl = () => {
    navigator.clipboard.writeText(window.location.origin + apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
    <main className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
      <div className="flex items-center gap-2" style={{ width: W }}>
        <span className="text-lg font-bold mr-auto">Create</span>
        <Button
          variant="outline"
          size="lg"
          onClick={toggleAnimation}
          className={`text-sm gap-2 ${animating ? "bg-foreground/10" : ""}`}
        >
          <PixelIcon name={animating ? "stop" : "play"} className="size-4" />
          {animating ? "Stop" : "Play"}
        </Button>
        <Button variant="outline" size="lg" onClick={shuffle} className="text-sm gap-2">
          <PixelIcon name="shuffle" className="size-4" />
          Shuffle
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="text-sm gap-2">
              <PixelIcon name="download" className="size-4" />
              Download
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

      <div className="flex flex-col gap-1" style={{ width: W }}>
        {layerOrder.map((category) => (
          <DropdownMenu key={category}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="w-full justify-between text-sm px-4">
                <span className="text-muted-foreground">{layerLabel[category]}</span>
                <span className="flex items-center gap-2">
                  {parts[category][selection[category]].name}
                  <PixelIcon name="chevron-down" className="size-4 text-muted-foreground" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {parts[category].map((option, i) => (
                <DropdownMenuItem key={option.name} onClick={() => pick(category, i)} className={`text-sm ${i === selection[category] ? "bg-accent" : ""}`}>
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      <div className="border border-border h-9 px-3 flex items-center gap-3 text-sm text-muted-foreground" style={{ width: W }}>
        <span className="font-bold uppercase tracking-wide">ID</span>
        <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-foreground transition-colors">
          {pixabotId}
        </a>
        <span className="text-border">|</span>
        <a href={`${apiUrl}?format=json`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          json
        </a>
        <span className="text-border">|</span>
        <a href={`${apiUrl}?size=960`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          960px
        </a>
        <span className="text-border">|</span>
        <a href={`${apiUrl}?animated=true`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          gif
        </a>
        <button onClick={copyApiUrl} className="ml-auto hover:text-foreground transition-colors cursor-pointer" title="Copy API URL">
          <PixelIcon name={copied ? "check" : "copy"} className="size-4" />
        </button>
      </div>

    </main>
  );
}
