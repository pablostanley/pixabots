export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const MIN_SIZE = 32;
export const MAX_SIZE = 1920;
export const DEFAULT_SIZE = 128;

export const MIN_SPEED = 0.25;
export const MAX_SPEED = 4;

export function isValidSize(n: number) {
  return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
}

export const INVALID_SIZE_MESSAGE = `Invalid size. Must be an integer between ${MIN_SIZE} and ${MAX_SIZE}.`;

/**
 * Deterministic renders (a given `/api/pixabot/{id}?...` URL always
 * produces the same bytes at any point in time, but sprite art can change
 * when we ship new part variants). 1-day fresh window for CDN / browser
 * cache, then 7 days of stale-while-revalidate — art updates propagate
 * within a day without a manual CDN purge, but repeat loads stay fast.
 * Manual purge still wins if we need instant rollout.
 */
export const DETERMINISTIC_CACHE =
  "public, max-age=86400, stale-while-revalidate=604800";

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function imageResponse(buffer: Buffer, contentType: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": DETERMINISTIC_CACHE,
      "CDN-Cache-Control": DETERMINISTIC_CACHE,
      ...CORS_HEADERS,
    },
  });
}
