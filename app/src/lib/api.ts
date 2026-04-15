export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
