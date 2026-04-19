"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { useSfx } from "@/lib/use-sfx";

const SWATCHES: string[] = [
  // Row 1 — neutrals + pastels
  "#ffffff",
  "#f5f5f4",
  "#fde68a",
  "#bbf7d0",
  "#bae6fd",
  "#fbcfe8",
  "#c4b5fd",
  "#000000",
  // Row 2 — saturated brights
  "#dc2626", // red
  "#ea580c", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#16a34a", // green
  "#14b8a6", // teal
  "#2563eb", // blue
  "#9333ea", // purple
  "#db2777", // hot pink
];

const CHECKER =
  "linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(-45deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted) 75%), linear-gradient(-45deg, transparent 75%, var(--muted) 75%)";

function normalizeHex(v: string): string | null {
  const raw = v.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

export function Inspector({
  hue,
  saturate,
  onHueChange,
  onSaturateChange,
  onRandom,
  onReset,
  bg,
  onBgChange,
  onClose,
}: {
  hue: number;
  saturate: number;
  onHueChange: (v: number) => void;
  onSaturateChange: (v: number) => void;
  onRandom: () => void;
  onReset: () => void;
  bg: string | null;
  onBgChange: (color: string | null, index: number) => void;
  onClose: () => void;
}) {
  const active = hue !== 0 || saturate !== 1 || bg !== null;
  const [hexInput, setHexInput] = useState(bg ?? "");
  const [tab, setTab] = useState<"bg" | "adj">("bg");
  const sfx = useSfx();

  const setBgColor = (color: string) => {
    setHexInput(color);
    const n = normalizeHex(color);
    if (n) {
      onBgChange(n, -1);
      sfx.playColor(n);
    }
  };

  return (
    <aside
      aria-label="Effects inspector"
      className="
        fixed lg:static left-0 right-0 bottom-0 z-40
        h-[55vh] lg:h-auto lg:max-h-[calc(100dvh-6rem)]
        w-full lg:w-[280px] lg:shrink-0
        border-t lg:border border-border bg-background
        flex flex-col
        shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] lg:shadow-none
        motion-safe:animate-in motion-safe:slide-in-from-bottom lg:motion-safe:slide-in-from-bottom-0 motion-safe:fade-in-0 motion-safe:duration-200
      "
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">Effects</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRandom}
            data-tooltip="Random adjustments"
            aria-label="Random adjustments"
            className="size-7 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <PixelIcon name="shuffle" className="size-3.5" />
          </button>
          {active && (
            <button
              type="button"
              onClick={onReset}
              data-tooltip="Reset"
              aria-label="Reset effects"
              className="size-7 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="text-sm">×</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            data-tooltip="Close"
            aria-label="Close inspector"
            className="size-7 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer ml-1"
          >
            <PixelIcon name="chevron-right" className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div role="tablist" aria-label="Inspector sections" className="lg:hidden flex gap-1 px-4 pb-3 border-b border-border">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bg"}
          onClick={() => setTab("bg")}
          className={`flex-1 px-3 py-1.5 text-sm border border-border transition-colors cursor-pointer ${
            tab === "bg" ? "bg-muted text-foreground" : "bg-background text-muted-foreground"
          }`}
        >
          Background
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "adj"}
          onClick={() => setTab("adj")}
          className={`flex-1 px-3 py-1.5 text-sm border border-border transition-colors cursor-pointer ${
            tab === "adj" ? "bg-muted text-foreground" : "bg-background text-muted-foreground"
          }`}
        >
          Adjustments
        </button>
      </div>

      <div className="flex flex-col gap-7 overflow-y-auto px-4 pb-4 pt-2 lg:pt-0 flex-1">
      <section className={`flex-col gap-3 ${tab === "bg" ? "flex" : "hidden"} lg:flex`}>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:block">Background</h3>
        <HexColorPicker
          color={bg ?? "#ffffff"}
          onChange={setBgColor}
          style={{ width: "100%", height: 140 }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">HEX</span>
          <input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={() => {
              const n = normalizeHex(hexInput);
              if (n) onBgChange(n, -1);
              else setHexInput(bg ?? "");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="ffffff"
            maxLength={7}
            className="flex-1 font-mono text-sm border border-border px-2 py-1 bg-background outline-none focus:border-foreground"
          />
        </div>
        <div className="grid grid-cols-9 gap-1">
          <button
            type="button"
            onClick={() => {
              setHexInput("");
              onBgChange(null, -1);
            }}
            title="Transparent"
            className={`relative aspect-square border ${
              bg === null ? "border-foreground border-2" : "border-border"
            } cursor-pointer overflow-hidden`}
            style={{
              backgroundImage: CHECKER,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
            }}
          >
            {/* Diagonal line corner-to-corner for clarity */}
            <span
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to top right, transparent calc(50% - 1px), var(--border) calc(50% - 1px), var(--border) calc(50% + 1px), transparent calc(50% + 1px))",
              }}
            />
          </button>
          {SWATCHES.map((color, i) => {
            const isActive = bg === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setHexInput(color);
                  onBgChange(color, i);
                }}
                title={color}
                className={`aspect-square border ${
                  isActive ? "border-foreground border-2" : "border-border"
                } cursor-pointer`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </section>

      <section className={`flex-col gap-3 ${tab === "adj" ? "flex" : "hidden"} lg:flex`}>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground hidden lg:block">Adjustments</h3>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Hue</span>
            <span className="font-mono">{hue}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={hue}
            onChange={(e) => {
              const v = Number(e.target.value);
              onHueChange(v);
              sfx.playSlider(v / 359);
            }}
            onDoubleClick={() => onHueChange(0)}
            aria-label="Hue rotation (0–359 degrees)"
            className="h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border
              [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#ff0000_0%,#ffff00_17%,#00ff00_33%,#00ffff_50%,#0000ff_67%,#ff00ff_83%,#ff0000_100%)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
              [&::-moz-range-track]:h-4 [&::-moz-range-track]:border [&::-moz-range-track]:border-border
              [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:rounded-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Saturation</span>
            <span className="font-mono">{saturate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={saturate}
            onChange={(e) => {
              const v = Number(e.target.value);
              onSaturateChange(v);
              sfx.playSlider(v / 2);
            }}
            onDoubleClick={() => onSaturateChange(1)}
            aria-label="Saturation multiplier (0 to 2)"
            className="h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border
              [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--muted)_0%,var(--foreground)_100%)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
              [&::-moz-range-track]:h-4 [&::-moz-range-track]:border [&::-moz-range-track]:border-border
              [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:rounded-none"
          />
        </label>
      </section>
      </div>
    </aside>
  );
}
