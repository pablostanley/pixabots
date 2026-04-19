import { type NextRequest } from "next/server";
import { decode, isValidId, resolve, randomId } from "@pixabots/core";
import {
  CORS_HEADERS,
  optionsResponse,
  isValidSize,
  INVALID_SIZE_MESSAGE,
  DEFAULT_SIZE,
} from "@/lib/api";
import { normalizeHex } from "@/lib/palette";

export const OPTIONS = optionsResponse;

const MAX_IDS = 100;
const IMMUTABLE = "public, max-age=31536000, immutable";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sizeParam = params.get("size");
  const size = sizeParam ? Number(sizeParam) : DEFAULT_SIZE;

  if (!isValidSize(size)) {
    return Response.json(
      { error: INVALID_SIZE_MESSAGE },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const idsRaw = params.get("ids");
  const countParam = params.get("count");
  const count = countParam ? Number(countParam) : 0;

  let ids: string[] = [];

  if (idsRaw) {
    ids = idsRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  } else if (Number.isInteger(count) && count > 0) {
    ids = Array.from({ length: Math.min(count, MAX_IDS) }, () => randomId());
  } else {
    return Response.json(
      {
        error:
          "Provide either `ids=a,b,c,...` (up to 100) or `count=N` for N random pixabots.",
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (ids.length === 0) {
    return Response.json(
      { error: "No IDs provided." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (ids.length > MAX_IDS) {
    return Response.json(
      { error: `Too many IDs. Max is ${MAX_IDS}.` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const invalid = ids.filter((id) => !isValidId(id));
  if (invalid.length > 0) {
    return Response.json(
      { error: `Invalid IDs: ${invalid.join(", ")}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Forward palette + bg into the per-bot URLs so consumers get recolored
  // variants without having to append the params themselves.
  const paletteParts: string[] = [];
  const hueRaw = params.get("hue");
  const satRaw = params.get("saturate");
  const bgRaw = params.get("bg");
  if (hueRaw !== null) {
    const n = Number(hueRaw);
    if (Number.isFinite(n)) paletteParts.push(`hue=${((Math.round(n) % 360) + 360) % 360}`);
  }
  if (satRaw !== null) {
    const n = Number(satRaw);
    if (Number.isFinite(n)) paletteParts.push(`saturate=${Math.max(0, Math.min(4, n))}`);
  }
  if (bgRaw !== null) {
    const bg = normalizeHex(bgRaw);
    if (bg) paletteParts.push(`bg=${encodeURIComponent(bg)}`);
  }
  const pal = paletteParts.length ? `&${paletteParts.join("&")}` : "";

  const origin = request.nextUrl.origin;
  const pixabots = ids.map((id) => {
    const combo = decode(id);
    return {
      id,
      combo,
      parts: resolve(combo),
      png: `${origin}/api/pixabot/${id}?size=${size}${pal}`,
      gif: `${origin}/api/pixabot/${id}?size=${size}&animated=true${pal}`,
    };
  });

  const deterministic = Boolean(idsRaw);
  return Response.json(
    { count: pixabots.length, pixabots },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": deterministic ? IMMUTABLE : "no-store",
      },
    }
  );
}
