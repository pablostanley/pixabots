"use client";

import { PixelIcon } from "@/components/ui/pixel-icon";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function PalettePicker({
  hue,
  saturate,
  onHueChange,
  onSaturateChange,
  onRandom,
  onReset,
}: {
  hue: number;
  saturate: number;
  onHueChange: (v: number) => void;
  onSaturateChange: (v: number) => void;
  onRandom: () => void;
  onReset: () => void;
}) {
  const active = hue !== 0 || saturate !== 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={active ? `Palette: hue ${hue}°, saturation ${saturate.toFixed(2)}` : "Palette effects"}
          data-tooltip={active ? `Fx · ${hue}° · ${saturate.toFixed(2)}` : "Effects"}
          className={`size-10 border-2 ${active ? "border-foreground/60 bg-foreground/10" : "border-border"} hover:border-foreground/60 transition-colors cursor-pointer shrink-0 flex items-center justify-center font-mono text-sm font-bold`}
        >
          Fx
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="center" className="w-[260px] p-3 flex flex-col gap-3" sideOffset={8}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="uppercase tracking-wide">Palette</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRandom}
              data-tooltip="Random palette"
              aria-label="Random palette"
              className="size-6 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <PixelIcon name="shuffle" className="size-3" />
            </button>
            {active && (
              <button
                type="button"
                onClick={onReset}
                data-tooltip="Reset palette"
                aria-label="Reset palette"
                className="size-6 flex items-center justify-center border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                <span aria-hidden="true" className="text-xs">×</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="w-16">Hue</span>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={hue}
            onChange={(e) => onHueChange(Number(e.target.value))}
            onDoubleClick={() => onHueChange(0)}
            aria-label="Hue rotation (0–359 degrees)"
            className="flex-1 h-6 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border
              [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,#ff0000_0%,#ffff00_17%,#00ff00_33%,#00ffff_50%,#0000ff_67%,#ff00ff_83%,#ff0000_100%)]
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
              [&::-moz-range-track]:h-4 [&::-moz-range-track]:border [&::-moz-range-track]:border-border
              [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:rounded-none"
          />
          <span className="font-mono w-10 text-right">{hue}°</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="w-16">Saturation</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={saturate}
            onChange={(e) => onSaturateChange(Number(e.target.value))}
            onDoubleClick={() => onSaturateChange(1)}
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
      </PopoverContent>
    </Popover>
  );
}
