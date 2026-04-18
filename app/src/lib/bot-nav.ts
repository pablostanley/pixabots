import { decode, encode, partCount } from "@pixabots/core";

const EYES = partCount("eyes");
const HEADS = partCount("heads");
const BODY = partCount("body");
const TOP = partCount("top");
const TOTAL = EYES * HEADS * BODY * TOP;

function comboToIndex(id: string): number {
  const { eyes, heads, body, top } = decode(id);
  return top + body * TOP + heads * TOP * BODY + eyes * TOP * BODY * HEADS;
}

function indexToId(i: number): string {
  const n = ((i % TOTAL) + TOTAL) % TOTAL;
  const top = n % TOP;
  const body = Math.floor(n / TOP) % BODY;
  const heads = Math.floor(n / (TOP * BODY)) % HEADS;
  const eyes = Math.floor(n / (TOP * BODY * HEADS));
  return encode({ eyes, heads, body, top });
}

export function nextId(id: string): string {
  return indexToId(comboToIndex(id) + 1);
}

export function prevId(id: string): string {
  return indexToId(comboToIndex(id) - 1);
}
