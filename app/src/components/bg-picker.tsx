"use client";

const SWATCHES: { color: string | null; label: string }[] = [
  { color: null, label: "Transparent" },
  { color: "#ffffff", label: "White" },
  { color: "#000000", label: "Black" },
  { color: "#f5f5f4", label: "Stone" },
  { color: "#fde68a", label: "Sand" },
  { color: "#bbf7d0", label: "Mint" },
  { color: "#bae6fd", label: "Sky" },
  { color: "#fbcfe8", label: "Pink" },
  { color: "#c4b5fd", label: "Lilac" },
];

export function BgPicker({
  bg,
  onChange,
}: {
  bg: string | null;
  onChange: (color: string | null, index: number) => void;
}) {
  return (
    <div className="w-full max-w-[504px] flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
      <span className="mr-1">Background</span>
      {SWATCHES.map((s, i) => {
        const active = bg === s.color;
        const isTransparent = s.color === null;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange(s.color, i)}
            aria-pressed={active}
            title={s.label}
            className={`size-6 border ${active ? "border-foreground border-2" : "border-border"} cursor-pointer relative`}
            style={{
              backgroundColor: s.color ?? "transparent",
              backgroundImage: isTransparent
                ? "linear-gradient(45deg, var(--muted) 25%, transparent 25%), linear-gradient(-45deg, var(--muted) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted) 75%), linear-gradient(-45deg, transparent 75%, var(--muted) 75%)"
                : undefined,
              backgroundSize: isTransparent ? "8px 8px" : undefined,
              backgroundPosition: isTransparent ? "0 0, 0 4px, 4px -4px, -4px 0" : undefined,
            }}
          >
            <span className="sr-only">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
