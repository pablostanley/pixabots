"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const SWATCHES: string[] = [
  "#ffffff",
  "#000000",
  "#f5f5f4",
  "#fde68a",
  "#bbf7d0",
  "#bae6fd",
  "#fbcfe8",
  "#c4b5fd",
];

const CHECKER =
  "linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(-45deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted) 75%), linear-gradient(-45deg, transparent 75%, var(--muted) 75%)";

function normalizeHex(v: string): string | null {
  const raw = v.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

export function BgPicker({
  bg,
  onChange,
}: {
  bg: string | null;
  onChange: (color: string | null, index: number) => void;
}) {
  const [hexInput, setHexInput] = useState(bg ?? "");

  const setColor = (color: string) => {
    setHexInput(color);
    const normalized = normalizeHex(color);
    if (normalized) onChange(normalized, -1);
  };

  const setTransparent = () => {
    setHexInput("");
    onChange(null, -1);
  };

  const pickSwatch = (color: string, index: number) => {
    setHexInput(color);
    onChange(color, index);
  };

  const transparent = bg === null;

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={transparent ? "Background: transparent" : `Background: ${bg}`}
            data-tooltip="Background"
            className="size-10 border-2 border-border hover:border-foreground/60 transition-colors cursor-pointer relative"
            style={
              transparent
                ? {
                    backgroundImage: CHECKER,
                    backgroundSize: "12px 12px",
                    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
                  }
                : { backgroundColor: bg ?? "transparent" }
            }
          />
        </PopoverTrigger>
        <PopoverContent className="w-[232px] p-3 flex flex-col gap-3" sideOffset={8}>
          <HexColorPicker
            color={bg ?? "#ffffff"}
            onChange={setColor}
            style={{ width: "100%", height: 160 }}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">HEX</span>
            <input
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={() => {
                const n = normalizeHex(hexInput);
                if (n) onChange(n, -1);
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
          <div className="grid grid-cols-8 gap-1">
            <button
              type="button"
              onClick={setTransparent}
              title="Transparent"
              className={`aspect-square border ${
                transparent ? "border-foreground border-2" : "border-border"
              } cursor-pointer`}
              style={{
                backgroundImage: CHECKER,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
              }}
            />
            {SWATCHES.map((color, i) => {
              const active = bg === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => pickSwatch(color, i)}
                  title={color}
                  className={`aspect-square border ${
                    active ? "border-foreground border-2" : "border-border"
                  } cursor-pointer`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
