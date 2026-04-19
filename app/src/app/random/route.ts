import { type NextRequest, NextResponse } from "next/server";
import { randomId } from "@pixabots/core";

/**
 * Share-friendly redirect. `/random` picks a fresh pixabot each request and
 * 302s to `/bot/{id}`. Any `hue`/`saturate` query params are forwarded so
 * `/random?hue=120` lands on a recolored detail page.
 *
 * `force-dynamic` so Next never caches the redirect target at build time.
 */
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const id = randomId();
  const url = new URL(`/bot/${id}`, req.url);
  for (const key of ["hue", "saturate"]) {
    const value = req.nextUrl.searchParams.get(key);
    if (value !== null) url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 302);
}
