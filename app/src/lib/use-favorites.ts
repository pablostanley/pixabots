"use client";

import { useSyncExternalStore } from "react";
import { isValidId } from "@pixabots/core";

const KEY = "pixabots:favorites";
const EVENT = "pixabots:favorites:change";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((v): v is string => typeof v === "string" && isValidId(v));
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

let cache: string[] = [];
let cacheKey = "";

function getSnapshot(): string[] {
  const raw = typeof localStorage !== "undefined" ? (localStorage.getItem(KEY) ?? "") : "";
  if (raw === cacheKey) return cache;
  cacheKey = raw;
  cache = read();
  return cache;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getServerSnapshot(): string[] {
  return [];
}

export interface ImportResult {
  /** New IDs added after dedupe */
  added: number;
  /** Entries in the import that weren't valid pixabot IDs */
  invalid: number;
  /** True when the raw blob didn't parse or had a shape we don't recognize */
  malformed: boolean;
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = (id: string) => {
    if (!isValidId(id)) return;
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
  };

  const has = (id: string) => ids.includes(id);

  /** Wrapped in a versioned envelope so future migrations don't break old files. */
  const exportJson = (): string =>
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ids: read() }, null, 2);

  /**
   * Accepts either the versioned envelope or a bare array of ids. Merges
   * valid entries into the existing set (dedupe preserves order: existing
   * first, then new arrivals).
   */
  const importJson = (raw: string): ImportResult => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { added: 0, invalid: 0, malformed: true };
    }
    const incoming: unknown = Array.isArray(parsed)
      ? parsed
      : (parsed as { ids?: unknown })?.ids;
    if (!Array.isArray(incoming)) {
      return { added: 0, invalid: 0, malformed: true };
    }
    const valid = incoming.filter(
      (v): v is string => typeof v === "string" && isValidId(v)
    );
    const current = read();
    const seen = new Set(current);
    const merged = [...current];
    let added = 0;
    for (const id of valid) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
        added += 1;
      }
    }
    if (added > 0) write(merged);
    return { added, invalid: incoming.length - valid.length, malformed: false };
  };

  return { ids, toggle, has, exportJson, importJson };
}
