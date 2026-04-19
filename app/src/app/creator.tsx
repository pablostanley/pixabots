"use client";

import { useState, useRef, useCallback } from "react";
import { useKeydown } from "@/lib/use-keydown";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { encode, decode, isValidId, randomCombo, resolve, ANIM_FRAMES, FRAME_MS, type AnimFrame } from "@pixabots/core";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useShareOrCopy } from "@/lib/use-share-or-copy";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { ShuffleHint, dismissShuffleHint } from "@/components/shuffle-hint";
import { BgPicker } from "@/components/bg-picker";
import { useSfx } from "@/lib/use-sfx";
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

function paletteQs(p: { hue: number; saturate: number }, hasExisting: boolean): string {
  const parts: string[] = [];
  if (p.hue !== 0) parts.push(`hue=${p.hue}`);
  if (p.saturate !== 1) parts.push(`saturate=${p.saturate.toFixed(2)}`);
  if (parts.length === 0) return "";
  return (hasExisting ? "&" : "?") + parts.join("&");
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
  offsets?: AnimFrame,
  bg?: string | null
) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, DISPLAY, DISPLAY);
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, DISPLAY, DISPLAY);
  }
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

export function Creator({
  initialId,
  initialHue = 0,
  initialSaturate = 1,
}: {
  initialId: string | null;
  initialHue?: number;
  initialSaturate?: number;
}) {
  const [selection, setSelection] = useState(() => {
    if (initialId && isValidId(initialId)) return decode(initialId);
    return randomCombo();
  });
  const reducedMotion = usePrefersReducedMotion();
  const [animating, setAnimating] = useState(true);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [bg, setBg] = useState<string | null>(null);
  const bgRef = useRef<string | null>(null);
  bgRef.current = bg;
  const [hue, setHueState] = useState(initialHue);
  const hueRef = useRef(initialHue);
  hueRef.current = hue;
  const [saturate, setSaturateState] = useState(initialSaturate);
  const saturateRef = useRef(initialSaturate);
  saturateRef.current = saturate;
  const [locks, setLocks] = useState<Record<PartCategory, boolean>>({
    eyes: false,
    heads: false,
    body: false,
    top: false,
  });
  const [copied, share] = useShareOrCopy();
  const sfx = useSfx();

  const pixabotId = encode(selection);
  const apiUrl = `/api/pixabot/${pixabotId}`;
  const partNames = resolve(selection);
  const announcement = `Pixabot ${pixabotId}: ${partNames.eyes}, ${partNames.heads}, ${partNames.body}, ${partNames.top}.`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const frameRef = useRef(0);
  const genRef = useRef(0);
  const selRef = useRef(selection);
  const mountedRef = useRef(false);
  const animatingRef = useRef(true);
  const konamiRef = useRef<string[]>([]);

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
      drawOnCanvas(canvasRef.current, loaded, undefined, bgRef.current);
    }
  }

  function startAnimation() {
    if (intervalRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatingRef.current = false;
      setAnimating(false);
      if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current, undefined, bgRef.current);
      return;
    }
    frameRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (canvasRef.current) {
        drawOnCanvas(canvasRef.current, imagesRef.current, ANIM_FRAMES[frameRef.current], bgRef.current);
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
    if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current, undefined, bgRef.current);
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

  function syncUrl(id: string, h: number, s: number) {
    const qs = new URLSearchParams();
    qs.set("id", id);
    if (h !== 0) qs.set("hue", String(h));
    if (s !== 1) qs.set("saturate", s.toFixed(2));
    window.history.replaceState(null, "", `/?${qs.toString()}`);
  }

  function updateSelection(next: Record<PartCategory, number>) {
    selRef.current = next;
    setSelection(next);
    loadAndDraw(next);
    const nextId = encode(next);
    syncUrl(nextId, hueRef.current, saturateRef.current);
    dismissShuffleHint();
    const el = canvasWrapRef.current;
    if (el) {
      el.classList.remove("part-pulse");
      void el.offsetWidth;
      el.classList.add("part-pulse");
    }
  }

  const cycle = (category: PartCategory) => {
    const prev = selRef.current;
    const nextIndex = (prev[category] + 1) % parts[category].length;
    updateSelection({
      ...prev,
      [category]: nextIndex,
    });
    sfx.play({ kind: "cycle", category, index: nextIndex });
  };

  const pick = (category: PartCategory, index: number) => {
    updateSelection({ ...selRef.current, [category]: index });
    sfx.play({ kind: "pick", category, index });
  };

  const shuffle = () => {
    const rand = randomCombo();
    const prev = selRef.current;
    updateSelection({
      eyes: locks.eyes ? prev.eyes : rand.eyes,
      heads: locks.heads ? prev.heads : rand.heads,
      body: locks.body ? prev.body : rand.body,
      top: locks.top ? prev.top : rand.top,
    });
    sfx.play({ kind: "shuffle" });
  };

  const toggleLock = (category: PartCategory) => {
    setLocks((l) => ({ ...l, [category]: !l[category] }));
  };

  const setHue = (v: number) => {
    setHueState(v);
    hueRef.current = v;
    syncUrl(encode(selRef.current), v, saturateRef.current);
  };

  const setSaturate = (v: number) => {
    setSaturateState(v);
    saturateRef.current = v;
    syncUrl(encode(selRef.current), hueRef.current, v);
  };

  const applyBg = (color: string | null, index?: number) => {
    setBg(color);
    bgRef.current = color;
    if (canvasRef.current && !intervalRef.current) {
      drawOnCanvas(canvasRef.current, imagesRef.current, undefined, color);
    }
    if (typeof index === "number" && index >= 0) sfx.play({ kind: "bg", index });
  };

  const copyShareUrl = () => {
    const qs = new URLSearchParams();
    qs.set("id", pixabotId);
    if (hue !== 0) qs.set("hue", String(hue));
    if (saturate !== 1) qs.set("saturate", saturate.toFixed(2));
    share({
      url: `${window.location.origin}/?${qs.toString()}`,
      title: `Pixabot ${pixabotId}`,
      text: `Check out pixabot ${pixabotId}`,
    });
    sfx.play({ kind: "copy" });
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
    if (bgRef.current) {
      ctx.fillStyle = bgRef.current;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.imageSmoothingEnabled = false;
    const filters: string[] = [];
    if (hueRef.current !== 0) filters.push(`hue-rotate(${hueRef.current}deg)`);
    if (saturateRef.current !== 1) filters.push(`saturate(${saturateRef.current})`);
    if (filters.length) {
      // Canvas filter applies to subsequent drawImage calls. Alpha preserved.
      ctx.filter = filters.join(" ");
    }
    for (const category of layerOrder) {
      const img = imagesRef.current[category];
      if (img) ctx.drawImage(img, 0, 0, size, size);
    }
    const link = document.createElement("a");
    link.download = `pixabot-${size}x${size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    sfx.play({ kind: "download" });
  };

  const KONAMI = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];

  const runKonami = () => {
    let count = 0;
    const interval = setInterval(() => {
      updateSelection(randomCombo());
      count++;
      if (count >= 20) clearInterval(interval);
    }, 80);
  };

  // Empty deps is safe — cycle/shuffle/toggleAnimation all use refs internally
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    // Track Konami sequence in parallel with normal shortcuts
    const seq = konamiRef.current;
    seq.push(e.key);
    if (seq.length > KONAMI.length) seq.shift();
    if (seq.length === KONAMI.length && seq.every((k, i) => k === KONAMI[i])) {
      konamiRef.current = [];
      runKonami();
      return;
    }

    switch (e.key) {
      case " ":
        e.preventDefault();
        updateSelection(randomCombo());
        break;
      case "p":
        toggleAnimation();
        break;
      case "c":
        copyShareUrl();
        break;
      case "d":
        e.preventDefault();
        setDownloadOpen((o) => !o);
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
    <main className="flex flex-col items-center justify-center flex-1 gap-3 p-4 sm:gap-4 sm:p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
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
        <DropdownMenu open={downloadOpen} onOpenChange={setDownloadOpen}>
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
          <div ref={canvasWrapRef} className="border border-border p-2 sm:p-3 cursor-pointer active:scale-[0.98] transition-transform w-full max-w-[504px]" onClick={shuffle}>
            <canvas
              ref={setCanvasRef}
              width={DISPLAY}
              height={DISPLAY}
              className="block w-full h-auto"
              style={{
                imageRendering: "pixelated",
                filter:
                  hue !== 0 || saturate !== 1
                    ? `${hue !== 0 ? `hue-rotate(${hue}deg)` : ""} ${saturate !== 1 ? `saturate(${saturate})` : ""}`.trim()
                    : undefined,
              }}
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

      {/* Part selectors — swatch + 2x2 on mobile, 4 in a row on desktop */}
      <div className="flex items-stretch gap-1 w-full max-w-[504px]">
        <BgPicker bg={bg} onChange={applyBg} />
        <div className="grid grid-cols-2 sm:flex gap-1 flex-1 min-w-0">
        {layerOrder.map((category) => {
          const locked = locks[category];
          return (
            <div key={category} className="flex flex-1 min-w-0">
              <Button
                variant="outline"
                size="lg"
                onClick={() => cycle(category)}
                aria-pressed={locked}
                className={`rounded-none border-r-0 flex-1 text-sm gap-1.5 ${
                  locked ? "bg-foreground/10 border-foreground/60" : ""
                }`}
              >
                {locked && <span aria-hidden="true" className="text-xs leading-none">●</span>}
                {layerLabel[category]}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-lg" className={`rounded-none shrink-0 text-muted-foreground ${locked ? "border-foreground/60" : ""}`}>
                    <PixelIcon name="chevron-down" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleLock(category)} className="text-sm font-medium">
                    {locked ? "Unlock" : "Lock"} {layerLabel[category]}
                  </DropdownMenuItem>
                  {parts[category].map((option, i) => (
                    <DropdownMenuItem key={option.name} onClick={() => pick(category, i)} className={`text-sm ${i === selection[category] ? "bg-accent" : ""}`}>
                      {option.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        </div>
      </div>

      {/* Palette sliders */}
      <div className="w-full max-w-[504px] flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="w-16">Hue</span>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            onDoubleClick={() => setHue(0)}
            aria-label="Hue rotation (0–359 degrees)"
            className="flex-1 h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border
              [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#ff0000_0%,#ffff00_17%,#00ff00_33%,#00ffff_50%,#0000ff_67%,#ff00ff_83%,#ff0000_100%)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:-mt-0
              [&::-moz-range-track]:h-4 [&::-moz-range-track]:border [&::-moz-range-track]:border-border
              [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:rounded-none"
          />
          <span className="font-mono w-10 text-right">{hue}°</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16">Saturation</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={saturate}
            onChange={(e) => setSaturate(Number(e.target.value))}
            onDoubleClick={() => setSaturate(1)}
            aria-label="Saturation multiplier (0 to 2)"
            className="flex-1 h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border
              [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--muted)_0%,var(--foreground)_100%)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
              [&::-moz-range-track]:h-4 [&::-moz-range-track]:border [&::-moz-range-track]:border-border
              [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:rounded-none"
          />
          <span className="font-mono w-10 text-right">{saturate.toFixed(2)}</span>
        </div>
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
          <a
            href={`${apiUrl}${paletteQs({ hue, saturate }, false)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            PNG
          </a>
          <a
            href={`${apiUrl}?animated=true${paletteQs({ hue, saturate }, true)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GIF
          </a>
          <a href={`${apiUrl}?format=json`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            JSON
          </a>
        </div>
      </div>

      <ShuffleHint />
    </main>
  );
}
