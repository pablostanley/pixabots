import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import {
  CATEGORY_ORDER,
  PARTS,
  encode,
  isValidId,
  decode,
  randomCombo,
  type PartCategory,
  type PixabotCombo,
} from "@pixabots/core";

const DISPLAY = 480;
const PARTS_BASE = "https://pixabots.com/parts";
// Bottom-to-top compositing order matches the server-side renderer.
const LAYER_ORDER: PartCategory[] = ["top", "body", "heads", "eyes"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function initialCombo(): PixabotCombo {
  if (typeof window === "undefined") return randomCombo();
  const qs = new URLSearchParams(window.location.search);
  const id = qs.get("id");
  if (id && isValidId(id)) return decode(id);
  return randomCombo();
}

function subscribeKey(cb: () => void) {
  window.addEventListener("keydown", cb);
  return () => window.removeEventListener("keydown", cb);
}

export function App() {
  const [combo, setCombo] = useState<PixabotCombo>(initialCombo);
  const [hue, setHue] = useState(0);
  const [saturate, setSaturate] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const id = encode(combo);

  const draw = useCallback(
    async (c: PixabotCombo) => {
      const imgs = await Promise.all(
        LAYER_ORDER.map((cat) => loadImage(`${PARTS_BASE}/${PARTS[cat][c[cat]].path}`))
      );
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, DISPLAY, DISPLAY);
      imgs.forEach((img) => ctx.drawImage(img, 0, 0, DISPLAY, DISPLAY));
    },
    []
  );

  // Ref callback fires once on mount — no useEffect needed.
  const setCanvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node;
      if (node) draw(combo);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const update = (next: PixabotCombo) => {
    setCombo(next);
    draw(next);
    const qs = new URLSearchParams({ id: encode(next) });
    window.history.replaceState(null, "", `?${qs.toString()}`);
  };

  // Keyboard: Space shuffles; ← ↑ → ↓ cycle eyes/heads/body/top.
  useSyncExternalStore(
    subscribeKey,
    () => "",
    () => ""
  );
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " ") {
        e.preventDefault();
        return update(randomCombo());
      }
      const arrows: Record<string, PartCategory> = {
        ArrowRight: "eyes",
        ArrowLeft: "heads",
        ArrowUp: "body",
        ArrowDown: "top",
      };
      const cat = arrows[e.key];
      if (!cat) return;
      e.preventDefault();
      update({ ...combo, [cat]: (combo[cat] + 1) % PARTS[cat].length });
    },
    [combo]
  );
  // Subscribe handler via a throwaway store so it always sees the latest combo.
  useSyncExternalStore(
    (notify) => {
      window.addEventListener("keydown", handleKey);
      void notify;
      return () => window.removeEventListener("keydown", handleKey);
    },
    () => null,
    () => null
  );

  const cycle = (cat: PartCategory) =>
    update({ ...combo, [cat]: (combo[cat] + 1) % PARTS[cat].length });

  return (
    <main>
      <header>
        <h1>Pixabot creator</h1>
        <p className="hint">
          Space to shuffle · arrows to cycle · sliders recolor · this is ~150 LOC of copy-pasteable React.
        </p>
      </header>

      <div className="stage">
        <canvas
          ref={setCanvas}
          width={DISPLAY}
          height={DISPLAY}
          style={{
            imageRendering: "pixelated",
            filter: `hue-rotate(${hue}deg) saturate(${saturate})`,
          }}
        />
      </div>

      <div className="toolbar">
        <code>{id}</code>
        <button onClick={() => update(randomCombo())}>Shuffle</button>
        {CATEGORY_ORDER.map((cat) => (
          <button key={cat} onClick={() => cycle(cat)}>
            {cat === "eyes" ? "face" : cat}
          </button>
        ))}
      </div>

      <div className="fx">
        <label>
          Hue {hue}°
          <input
            type="range"
            min={0}
            max={359}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
          />
        </label>
        <label>
          Saturation {saturate.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={saturate}
            onChange={(e) => setSaturate(Number(e.target.value))}
          />
        </label>
      </div>

      <footer>
        <a href="https://pixabots.com/docs/creator">/docs/creator</a> ·{" "}
        <a href="https://github.com/pablostanley/pixabots">source</a>
      </footer>
    </main>
  );
}
