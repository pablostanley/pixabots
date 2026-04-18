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

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = (id: string) => {
    if (!isValidId(id)) return;
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
  };

  const has = (id: string) => ids.includes(id);

  return { ids, toggle, has };
}
