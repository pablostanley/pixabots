import { type NextRequest } from "next/server";
import { decode, isValidId, resolve } from "@pixabots/core";
import {
  renderPixabot,
  renderAnimatedPixabot,
  renderPixabotSvg,
  RenderError,
} from "@/lib/render";
import {
  CORS_HEADERS,
  optionsResponse,
  imageResponse,
  isValidSize,
  INVALID_SIZE_MESSAGE,
  DEFAULT_SIZE,
  MIN_SPEED,
  MAX_SPEED,
  DETERMINISTIC_CACHE,
} from "@/lib/api";
import { checkRate, clientKey } from "@/lib/rate-limit";
import { normalizeHex } from "@/lib/palette";

// Per-IP rate limit for animated renders (GIF / WebP are 5–50× costlier
// than PNG). Limits per minute per lambda instance.
const ANIMATED_LIMIT = 30;
const ANIMATED_WINDOW_MS = 60_000;

export const OPTIONS = optionsResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const sizeParam = request.nextUrl.searchParams.get("size");
  const size = sizeParam ? Number(sizeParam) : DEFAULT_SIZE;

  if (!isValidId(id)) {
    return Response.json(
      { error: "Invalid pixabot ID" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!isValidSize(size)) {
    return Response.json(
      { error: INVALID_SIZE_MESSAGE },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const combo = decode(id);
  const animated = request.nextUrl.searchParams.get("animated") === "true";
  const speedParam = request.nextUrl.searchParams.get("speed");

  // Palette transform (applies to raster output only)
  const hueParam = request.nextUrl.searchParams.get("hue");
  const saturateParam = request.nextUrl.searchParams.get("saturate");
  let hue: number | undefined;
  let saturate: number | undefined;
  if (hueParam !== null) {
    const h = Number(hueParam);
    if (!Number.isFinite(h)) {
      return Response.json(
        { error: "Invalid hue. Must be a number in degrees (0–359)." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    hue = ((Math.round(h) % 360) + 360) % 360;
  }
  if (saturateParam !== null) {
    const s = Number(saturateParam);
    if (!Number.isFinite(s) || s < 0 || s > 4) {
      return Response.json(
        { error: "Invalid saturate. Must be a number between 0 and 4." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    saturate = s;
  }
  const palette = hue !== undefined || saturate !== undefined ? { hue, saturate } : undefined;

  // Background color (flattens transparent pixels). Accepts #rrggbb.
  const bgParam = request.nextUrl.searchParams.get("bg");
  let bg: string | undefined;
  if (bgParam !== null) {
    const normalized = normalizeHex(bgParam);
    if (!normalized) {
      return Response.json(
        { error: "Invalid bg. Must be a #rrggbb hex color." },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    bg = normalized;
  }
  let speed = 1;
  if (speedParam !== null) {
    const parsed = Number(speedParam);
    if (!Number.isFinite(parsed)) {
      return Response.json(
        { error: `Invalid speed. Must be a number between ${MIN_SPEED} and ${MAX_SPEED}.` },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, parsed));
  }

  if (format === "json") {
    const origin = request.nextUrl.origin;
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${origin}/api/pixabot/${id}?size=${size}`,
        gif: `${origin}/api/pixabot/${id}?size=${size}&animated=true`,
      },
      { headers: CORS_HEADERS }
    );
  }

  try {
    if (format === "svg") {
      const svg = await renderPixabotSvg(combo, size, bg);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": DETERMINISTIC_CACHE,
          "CDN-Cache-Control": DETERMINISTIC_CACHE,
          ...CORS_HEADERS,
        },
      });
    }
    if (animated) {
      const rate = checkRate(`animated:${clientKey(request)}`, ANIMATED_LIMIT, ANIMATED_WINDOW_MS);
      if (!rate.allowed) {
        return Response.json(
          { error: `Rate limit exceeded. Try again in ${rate.resetSeconds}s.` },
          {
            status: 429,
            headers: {
              ...CORS_HEADERS,
              "Retry-After": String(rate.resetSeconds),
              "X-RateLimit-Limit": String(rate.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + rate.resetSeconds),
            },
          }
        );
      }
      const wantsWebp = request.nextUrl.searchParams.get("webp") === "true";
      const outFormat = wantsWebp ? "webp" : "gif";
      const buf = await renderAnimatedPixabot(combo, size, speed, outFormat, palette, bg);
      return imageResponse(buf, wantsWebp ? "image/webp" : "image/gif");
    }
    return imageResponse(await renderPixabot(combo, size, palette, bg), "image/png");
  } catch (e) {
    const status = e instanceof RenderError ? e.status : 500;
    const message = e instanceof RenderError ? e.message : "Render failed";
    return Response.json(
      { error: message },
      { status, headers: CORS_HEADERS }
    );
  }
}
