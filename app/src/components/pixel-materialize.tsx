"use client";

import { useCallback } from "react";

/**
 * Absolutely-positioned canvas overlay that sits on top of its parent and
 * materializes a 32×32 pixel mask away on first mount — revealing whatever
 * sits underneath (the pixabot image / canvas). Runs once per mount, never
 * on subsequent re-renders. Parent must be `relative`.
 *
 * Use on first-load surfaces (home creator, `/bot/[id]`, browse dialog
 * open) but NOT on actions that update the same mount (Space shuffle,
 * prev/next, palette change) — those re-render this component without
 * remounting it, so the animation doesn't fire.
 *
 * Reduced-motion users just get a short fade via CSS; no blocky reveal.
 */
export function PixelMaterialize({
  duration = 360,
}: {
  duration?: number;
}) {
  const attach = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (!node) return;
      // Honor reduced-motion preference: skip the blocky reveal.
      if (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ) {
        node.style.display = "none";
        return;
      }

      const rect = node.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;
      node.width = Math.round(w * dpr);
      node.height = Math.round(h * dpr);
      node.style.width = `${w}px`;
      node.style.height = `${h}px`;
      const ctx = node.getContext("2d");
      if (!ctx || w === 0 || h === 0) {
        node.style.display = "none";
        return;
      }
      ctx.scale(dpr, dpr);

      // Read the current background color so the mask matches the page.
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim() || "#ffffff";
      // The CSS variable is an HSL triple in this project — wrap it.
      const fill = bg.startsWith("hsl") || bg.startsWith("#") ? bg : `hsl(${bg})`;

      // 32 × 32 block grid matches the pixabot's native resolution.
      const cols = 32;
      const rows = 32;
      const bw = w / cols;
      const bh = h / rows;
      const blocks: Array<[number, number]> = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) blocks.push([x, y]);
      // Fisher–Yates shuffle: reveal order is random-but-even.
      for (let i = blocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      }

      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, w, h);

      const start = performance.now();
      const tick = (now: number) => {
        if (!node.isConnected) return;
        const t = Math.min(1, (now - start) / duration);
        // ease-out: progress^2 inverse for front-loaded reveal
        const eased = 1 - (1 - t) * (1 - t);
        const target = Math.floor(eased * blocks.length);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = fill;
        for (let i = target; i < blocks.length; i++) {
          const [x, y] = blocks[i];
          // +1 overlap prevents hairline seams from subpixel rounding
          ctx.fillRect(x * bw, y * bh, bw + 1, bh + 1);
        }
        if (t < 1) requestAnimationFrame(tick);
        else node.style.display = "none";
      };
      requestAnimationFrame(tick);
    },
    [duration]
  );

  return (
    <canvas
      ref={attach}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    />
  );
}
