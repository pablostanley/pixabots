import { type NextRequest } from "next/server";
import { isValidId } from "@pixabots/core";
import { generateOgImage } from "@/lib/og-image";
import { CORS_HEADERS, optionsResponse, imageResponse } from "@/lib/api";
import { checkRate, clientKey } from "@/lib/rate-limit";

const OG_LIMIT = 20;
const OG_WINDOW_MS = 60_000;

const MAX_TITLE_LEN = 60;
const MAX_SUBTITLE_LEN = 100;
const MAX_SEED_LEN = 80;

export const OPTIONS = optionsResponse;

function clampText(v: string | null, max: number): string | undefined {
  if (v == null) return undefined;
  return v.length > max ? v.slice(0, max) : v;
}

function parsePalette(
  params: URLSearchParams
): { hue?: number; saturate?: number } | undefined {
  const hueRaw = params.get("hue");
  const satRaw = params.get("saturate");
  let hue: number | undefined;
  let saturate: number | undefined;
  if (hueRaw !== null) {
    const n = Number(hueRaw);
    if (Number.isFinite(n)) hue = ((Math.round(n) % 360) + 360) % 360;
  }
  if (satRaw !== null) {
    const n = Number(satRaw);
    if (Number.isFinite(n)) saturate = Math.max(0, Math.min(4, n));
  }
  if (hue === undefined && saturate === undefined) return undefined;
  return { hue, saturate };
}

export async function GET(request: NextRequest) {
  const rate = checkRate(`og:${clientKey(request)}`, OG_LIMIT, OG_WINDOW_MS);
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

  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "grid";
  const title = clampText(params.get("title"), MAX_TITLE_LEN) ?? "Pixabots";
  const subtitle = clampText(params.get("subtitle"), MAX_SUBTITLE_LEN);
  const palette = parsePalette(params);

  try {
    if (type === "single") {
      const id = params.get("id");
      if (!id || !isValidId(id)) {
        return Response.json(
          { error: "Missing or invalid id" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const buffer = await generateOgImage({ type: "single", id, title, subtitle, palette });
      return imageResponse(buffer, "image/png");
    }

    if (type !== "grid") {
      return Response.json(
        { error: "type must be 'grid' or 'single'" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const seed = clampText(params.get("seed"), MAX_SEED_LEN) ?? title;
    const buffer = await generateOgImage({ type: "grid", title, subtitle, seed, palette });
    return imageResponse(buffer, "image/png");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "OG render failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
