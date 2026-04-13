"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const SIZES = [240, 480, 960, 1920] as const;
const DISPLAY = 480;
const NATIVE = 32;
const PX = DISPLAY / NATIVE; // 15 — one native pixel in canvas space

// Idle animation: y-offsets in native pixels per layer per frame
// body is clipped to original bounds so bottom pixel stays planted
const ANIM_FRAMES: Record<"top" | "heads" | "eyes" | "body", number>[] = [
  { top: 0, heads: 0, eyes: 0, body: 0 }, // rest
  { top: 0, heads: 0, eyes: 0, body: 0 }, // hold
  { top: 0, heads: 1, eyes: 1, body: 0 }, // head+face+body down, top stays
  { top: 1, heads: 2, eyes: 2, body: 1 }, // head+face down more, top follows
  { top: 2, heads: 2, eyes: 2, body: 1 }, // top catches up
  { top: 2.5, heads: 2, eyes: 2, body: 1 }, // top overshoots
  { top: 2, heads: 1, eyes: 1, body: 1 }, // bounce up
  { top: 1, heads: 0, eyes: 0, body: 0 }, // home, top trailing
];

const FRAME_MS = 72;

function randomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

function randomSelection(): Record<PartCategory, number> {
  return {
    eyes: randomIndex(parts.eyes.length),
    heads: randomIndex(parts.heads.length),
    body: randomIndex(parts.body.length),
    top: randomIndex(parts.top.length),
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

export default function Home() {
  const [selection, setSelection] = useState<Record<PartCategory, number>>(randomSelection);
  const [dark, setDark] = useState(true);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});

  const cycle = (category: PartCategory) => {
    setSelection((prev) => ({
      ...prev,
      [category]: (prev[category] + 1) % parts[category].length,
    }));
  };

  const pick = (category: PartCategory, index: number) => {
    setSelection((prev) => ({ ...prev, [category]: index }));
  };

  const shuffle = () => setSelection(randomSelection());

  const toggleTheme = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  const renderToCanvas = useCallback(
    async (size: number): Promise<HTMLCanvasElement> => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;

      for (const category of layerOrder) {
        const part = parts[category][selection[category]];
        const img = await loadImage(part.src);
        ctx.drawImage(img, 0, 0, size, size);
      }

      return canvas;
    },
    [selection]
  );

  const download = async (size: number) => {
    const canvas = await renderToCanvas(size);
    const link = document.createElement("a");
    link.download = `pixabot-${size}x${size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Preload images when selection changes
  useEffect(() => {
    const preload = async () => {
      const loaded: Record<string, HTMLImageElement> = {};
      for (const category of layerOrder) {
        const part = parts[category][selection[category]];
        loaded[category] = await loadImage(part.src);
      }
      imagesRef.current = loaded;
    };
    preload();
  }, [selection]);

  // Draw a single frame with optional offsets
  const drawFrame = useCallback(
    (offsets?: Record<"top" | "heads" | "eyes" | "body", number>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, DISPLAY, DISPLAY);
      ctx.imageSmoothingEnabled = false;

      for (const category of layerOrder) {
        const img = imagesRef.current[category];
        if (!img) return;
        const yOffset = offsets
          ? offsets[category as keyof typeof offsets] * PX
          : 0;

        if (category === "body" && yOffset > 0) {
          // Bottom 1px row stays static (feet planted)
          ctx.drawImage(img, 0, NATIVE - 1, NATIVE, 1, 0, DISPLAY - PX, DISPLAY, PX);
          // Rest of the body shifts down, clipped above the static row
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
    },
    []
  );

  // Static draw when not animating or selection changes
  useEffect(() => {
    if (animating) return;
    const timer = setTimeout(() => drawFrame(), 50); // small delay for image preload
    return () => clearTimeout(timer);
  }, [selection, animating, drawFrame]);

  // Animation loop
  useEffect(() => {
    if (!animating) {
      frameRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      const frame = ANIM_FRAMES[frameRef.current];
      drawFrame(frame);
      frameRef.current = (frameRef.current + 1) % ANIM_FRAMES.length;
    }, FRAME_MS);

    return () => clearInterval(interval);
  }, [animating, drawFrame]);

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh gap-4 p-6">
      {/* Top bar */}
      <div className="flex items-center gap-3" style={{ width: DISPLAY + 24 }}>
        <h1 className="text-2xl font-bold tracking-wide uppercase mr-auto">Pixabots</h1>
        <Button variant="outline" size="icon-lg" onClick={toggleTheme} title={dark ? "Light mode" : "Dark mode"} className="text-2xl">
          {dark ? <span className="translate-y-[0.2em]">*</span> : "•"}
        </Button>
        <Button
          variant="outline"
          size="icon-lg"
          onClick={() => setAnimating((a) => !a)}
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

      {/* Canvas preview */}
      <div className="border border-border bg-card p-3">
        <div className="checkerboard">
          <canvas
            ref={canvasRef}
            width={DISPLAY}
            height={DISPLAY}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Part combo buttons — full width, label cycles, chevron opens dropdown */}
      <div className="flex gap-1" style={{ width: DISPLAY + 24 }}>
        {layerOrder.map((category) => (
          <div key={category} className="flex flex-1 min-w-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => cycle(category)}
              className="rounded-none border-r-0 flex-1"
            >
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
                  <DropdownMenuItem
                    key={option.name}
                    onClick={() => pick(category, i)}
                    className={`text-sm ${i === selection[category] ? "bg-accent" : ""}`}
                  >
                    {option.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </main>
  );
}
