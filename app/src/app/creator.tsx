"use client";

import { useState, useRef, useCallback } from "react";
import { hasModifier, isTypingTarget, useKeydown } from "@/lib/use-keydown";
import { usePaste, parsePastedId } from "@/lib/use-paste";
import { parts, layerOrder, layerLabel, type PartCategory } from "@/lib/parts";
import { encode, decode, isValidId, randomCombo, resolve, ANIM_FRAMES, LOOP_LENGTH, FRAME_MS, resolveFrameIndex, PARTS, type AnimFrame } from "@pixabots/core";
import { Button } from "@/components/ui/button";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useShareOrCopy } from "@/lib/use-share-or-copy";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { ShuffleHint, dismissShuffleHint } from "@/components/shuffle-hint";
import { Inspector } from "@/components/inspector";
import { BG_CHOICES, withPalette } from "@/lib/palette";
import { useSfx } from "@/lib/use-sfx";
import { POP_IN } from "@/lib/motion";
import { PixelMaterialize } from "@/components/pixel-materialize";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  selection: Record<PartCategory, number>,
  offsets?: AnimFrame,
  bg?: string | null,
  tick: number = 0
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

    // Multi-frame sprite sheets (blink / sequence): pick the source-X column
    // for this tick. Static parts (frames ≤ 1) fall through to sx=0.
    const part = PARTS[category][selection[category]];
    const frameIdx = resolveFrameIndex(part, tick);
    const sx = frameIdx * NATIVE;

    if (category === "body" && yOffset > 0) {
      ctx.drawImage(img, sx, NATIVE - 1, NATIVE, 1, 0, DISPLAY - PX, DISPLAY, PX);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, DISPLAY, DISPLAY - PX);
      ctx.clip();
      ctx.drawImage(img, sx, 0, NATIVE, NATIVE - 1, 0, yOffset, DISPLAY, (NATIVE - 1) * PX);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, 0, NATIVE, NATIVE, 0, yOffset, DISPLAY, DISPLAY);
    }
  }
}

export function Creator({
  initialId,
  initialHue = 0,
  initialSaturate = 1,
  initialBg = null,
}: {
  initialId: string | null;
  initialHue?: number;
  initialSaturate?: number;
  initialBg?: string | null;
}) {
  const [selection, setSelection] = useState(() => {
    if (initialId && isValidId(initialId)) return decode(initialId);
    return randomCombo();
  });
  const reducedMotion = usePrefersReducedMotion();
  const [animating, setAnimating] = useState(true);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [bg, setBg] = useState<string | null>(initialBg);
  const bgRef = useRef<string | null>(initialBg);
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
      drawOnCanvas(canvasRef.current, loaded, selRef.current, undefined, bgRef.current, 0);
    }
  }

  function startAnimation() {
    if (intervalRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animatingRef.current = false;
      setAnimating(false);
      if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current, selRef.current, undefined, bgRef.current, 0);
      return;
    }
    frameRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (canvasRef.current) {
        const tick = frameRef.current;
        const offsets = ANIM_FRAMES[tick % ANIM_FRAMES.length];
        drawOnCanvas(canvasRef.current, imagesRef.current, selRef.current, offsets, bgRef.current, tick);
        frameRef.current = (tick + 1) % LOOP_LENGTH;
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
    if (canvasRef.current) drawOnCanvas(canvasRef.current, imagesRef.current, selRef.current, undefined, bgRef.current, 0);
    animatingRef.current = false;
    setAnimating(false);
  }

  function setCanvasRef(node: HTMLCanvasElement | null) {
    canvasRef.current = node;
    if (node && !mountedRef.current) {
      mountedRef.current = true;
      loadAndDraw(selRef.current);
      // If URL had no id/seed, we picked a random combo — write it to the URL
      // so refresh reproduces the same pixabot instead of re-rolling.
      if (!initialId) {
        syncUrl(encode(selRef.current), hueRef.current, saturateRef.current, bgRef.current);
      }
    }
  }

  function syncUrl(id: string, h: number, s: number, b: string | null) {
    const qs = new URLSearchParams();
    qs.set("id", id);
    if (h !== 0) qs.set("hue", String(h));
    if (s !== 1) qs.set("saturate", s.toFixed(2));
    if (b) qs.set("bg", b);
    window.history.replaceState(null, "", `/?${qs.toString()}`);
  }

  // Ring buffers for U undo / Shift+U redo. Capped at HISTORY_MAX each.
  const historyRef = useRef<Record<PartCategory, number>[]>([]);
  const redoRef = useRef<Record<PartCategory, number>[]>([]);
  const HISTORY_MAX = 20;

  function updateSelection(
    next: Record<PartCategory, number>,
    opts: { fromUndo?: boolean; fromRedo?: boolean } = {}
  ) {
    // On user-initiated changes: push prev onto undo stack, and clear redo
    // (standard editor semantics — a new action invalidates redo history).
    // From-undo pushes onto redo instead. From-redo pushes onto undo.
    if (opts.fromUndo) {
      redoRef.current.push(selRef.current);
      if (redoRef.current.length > HISTORY_MAX) redoRef.current.shift();
    } else {
      historyRef.current.push(selRef.current);
      if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
      if (!opts.fromRedo) redoRef.current.length = 0;
    }
    selRef.current = next;
    setSelection(next);
    loadAndDraw(next);
    const nextId = encode(next);
    syncUrl(nextId, hueRef.current, saturateRef.current, bgRef.current);
    dismissShuffleHint();
    const el = canvasWrapRef.current;
    if (el) {
      el.classList.remove("part-pulse");
      void el.offsetWidth;
      el.classList.add("part-pulse");
    }
  }

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    updateSelection(prev, { fromUndo: true });
    sfx.play({ kind: "cycle", category: "eyes", index: 0 });
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    updateSelection(next, { fromRedo: true });
    sfx.play({ kind: "cycle", category: "eyes", index: 0 });
  };

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
    syncUrl(encode(selRef.current), v, saturateRef.current, bgRef.current);
  };

  const setSaturate = (v: number) => {
    setSaturateState(v);
    saturateRef.current = v;
    syncUrl(encode(selRef.current), hueRef.current, v, bgRef.current);
  };

  const randomPalette = () => {
    const h = Math.floor(Math.random() * 360);
    // Skew saturate toward useful range 0.6–1.4 so random doesn't often
    // produce greyscale or oversaturated output.
    const s = Math.round((0.6 + Math.random() * 0.8) * 100) / 100;
    setHueState(h);
    hueRef.current = h;
    setSaturateState(s);
    saturateRef.current = s;
    const bgIdx = Math.floor(Math.random() * BG_CHOICES.length);
    applyBg(BG_CHOICES[bgIdx], bgIdx);
  };

  const resetPalette = () => {
    setHueState(0);
    hueRef.current = 0;
    setSaturateState(1);
    saturateRef.current = 1;
    applyBg(null);
  };

  const applyBg = (color: string | null, index?: number) => {
    setBg(color);
    bgRef.current = color;
    if (canvasRef.current && !intervalRef.current) {
      drawOnCanvas(canvasRef.current, imagesRef.current, selRef.current, undefined, color, 0);
    }
    if (typeof index === "number" && index >= 0) sfx.play({ kind: "bg", index });
    syncUrl(encode(selRef.current), hueRef.current, saturateRef.current, color);
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

  // SVG is vector and bakes only the combo — palette + bg are not supported
  // server-side for SVG, so we intentionally don't pass hue/saturate here.
  const downloadSvg = () => {
    const id = encode(selRef.current);
    const link = document.createElement("a");
    link.download = `pixabot-${id}.svg`;
    link.href = `/api/pixabot/${id}?format=svg`;
    link.click();
    sfx.play({ kind: "download" });
  };

  const downloadJson = () => {
    const id = encode(selRef.current);
    const link = document.createElement("a");
    link.download = `pixabot-${id}.json`;
    link.href = `/api/pixabot/${id}?format=json`;
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
    if (isTypingTarget(e.target)) return;
    // Let browser shortcuts (⌘R reload, ⌘C copy, ⌘K palette, etc.) through.
    // Otherwise ⌘R would fire the `r` case (randomPalette) and write random
    // hue/saturate/bg into the URL right before the browser reloads it.
    if (hasModifier(e)) return;

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
      case "f":
        e.preventDefault();
        setInspectorOpen((o) => !o);
        break;
      case "r":
        e.preventDefault();
        randomPalette();
        break;
      case "x":
        e.preventDefault();
        resetPalette();
        break;
      case "u":
        e.preventDefault();
        undo();
        break;
      case "U":
        e.preventDefault();
        redo();
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

  usePaste(
    useCallback((e: ClipboardEvent) => {
      const candidate = parsePastedId(e);
      if (!candidate) return;
      e.preventDefault();
      updateSelection(decode(candidate));
    }, [])
  );

  const fxActive = hue !== 0 || saturate !== 1 || bg !== null;

  return (
    <main className={`flex-1 flex justify-center items-center p-4 sm:p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 ${inspectorOpen ? "pb-[calc(55vh+1rem)] lg:pb-6" : ""}`}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</div>
      <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 lg:gap-6 w-full max-w-[820px]">
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full max-w-[504px] mx-auto">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={downloadSvg} className="text-sm">
              SVG (vector)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadJson} className="text-sm">
              JSON (metadata)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Canvas */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div ref={canvasWrapRef} className="relative border border-border p-2 sm:p-3 cursor-pointer active:scale-[0.97] transition-transform duration-150 ease-out w-full max-w-[504px]" onClick={shuffle}>
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
            <PixelMaterialize />
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
              <ContextMenuSeparator />
              <ContextMenuItem onClick={downloadSvg} className="text-sm">
                SVG (vector)
              </ContextMenuItem>
              <ContextMenuItem onClick={downloadJson} className="text-sm">
                JSON (metadata)
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={shuffle} className="text-sm">Shuffle</ContextMenuItem>
          <ContextMenuItem onClick={toggleAnimation} className="text-sm">{animating ? "Stop" : "Play"}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Part selectors — 2x2 on mobile, 4 in a row on desktop; swatch on the right */}
      <div className="flex items-stretch gap-1 w-full max-w-[504px]">
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
        <button
          type="button"
          onClick={() => setInspectorOpen((v) => !v)}
          aria-pressed={inspectorOpen}
          aria-label="Effects inspector"
          data-tooltip={fxActive ? `Fx · ${hue}° · ${saturate.toFixed(2)}` : "Effects"}
          className={`h-9 min-w-9 px-2 border ${
            fxActive || inspectorOpen ? "border-foreground/60 bg-foreground/10" : "border-border"
          } hover:bg-muted transition-colors cursor-pointer shrink-0 flex items-center justify-center font-mono text-sm font-bold`}
        >
          Fx
        </button>
      </div>

      {/* ID bar */}
      <div className="border border-border px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center gap-2 text-sm w-full max-w-[504px]">
        <a
          href={withPalette(`/bot/${pixabotId}`, { hue, saturate })}
          className="font-mono text-foreground hover:underline decoration-dotted underline-offset-2"
          data-tooltip="Open bot page"
        >
          {pixabotId}
        </a>
        <button onClick={copyShareUrl} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
          <PixelIcon
            key={copied ? "copied" : "idle"}
            name={copied ? "check" : "copy"}
            className={`size-4 ${copied ? POP_IN : ""}`}
          />
          <span
            key={copied ? "c" : "i"}
            className={`${copied ? "text-foreground animate-in fade-in-0 duration-150 ease-out" : ""}`}
          >
            {copied ? "Copied!" : "Share"}
          </span>
        </button>
        <a
          href={withPalette(`/bot/${pixabotId}`, { hue, saturate })}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Details
          <span aria-hidden="true" className="text-xs">↗</span>
        </a>
        <div className="flex items-center gap-2 ml-auto">
          <a
            href={withPalette(apiUrl, { hue, saturate, bg })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            PNG
          </a>
          <a
            href={withPalette(`${apiUrl}?animated=true`, { hue, saturate, bg })}
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
      </div>

      {inspectorOpen && (
        <Inspector
          hue={hue}
          saturate={saturate}
          onHueChange={setHue}
          onSaturateChange={setSaturate}
          onRandom={randomPalette}
          onReset={resetPalette}
          bg={bg}
          onBgChange={applyBg}
          onClose={() => setInspectorOpen(false)}
        />
      )}
      </div>
    </main>
  );
}
