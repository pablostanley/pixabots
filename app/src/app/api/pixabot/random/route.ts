import { type NextRequest } from "next/server";
import { randomId, decode, resolve } from "@pixabots/core";
import {
  CORS_HEADERS,
  optionsResponse,
  isValidSize,
  INVALID_SIZE_MESSAGE,
  MIN_SPEED,
  MAX_SPEED,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export const OPTIONS = optionsResponse;

const FORWARDED_PARAMS = ["size", "animated", "speed", "webp"] as const;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const format = params.get("format");
  const id = randomId();

  if (format === "json") {
    const origin = request.nextUrl.origin;
    const combo = decode(id);
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${origin}/api/pixabot/${id}`,
        gif: `${origin}/api/pixabot/${id}?animated=true`,
      },
      { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } }
    );
  }

  const sizeParam = params.get("size");
  if (sizeParam !== null && !isValidSize(Number(sizeParam))) {
    return Response.json(
      { error: INVALID_SIZE_MESSAGE },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const speedParam = params.get("speed");
  if (speedParam !== null) {
    const parsed = Number(speedParam);
    if (!Number.isFinite(parsed)) {
      return Response.json(
        { error: `Invalid speed. Must be a number between ${MIN_SPEED} and ${MAX_SPEED}.` },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  const target = new URL(`/api/pixabot/${id}`, request.url);
  for (const key of FORWARDED_PARAMS) {
    const value = params.get(key);
    if (value !== null) target.searchParams.set(key, value);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
    },
  });
}
