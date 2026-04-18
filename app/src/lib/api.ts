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

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function imageResponse(buffer: Buffer, contentType: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": IMMUTABLE_CACHE,
      "CDN-Cache-Control": IMMUTABLE_CACHE,
      ...CORS_HEADERS,
    },
  });
}
