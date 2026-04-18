"use client";

import { useSyncExternalStore } from "react";

const KEY = "pixabots:hinted";
const EVENT = "pixabots:hinted:change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export function dismissShuffleHint() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function ShuffleHint() {
  const hinted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (hinted) return null;

  return (
    <div
      role="note"
      className="text-xs text-muted-foreground flex items-center gap-2 animate-in fade-in-0 duration-500"
    >
      <span className="font-mono border border-border px-1.5 py-0.5">SPACE</span>
      <span>to shuffle ·</span>
      <span className="font-mono border border-border px-1.5 py-0.5">?</span>
      <span>for shortcuts</span>
    </div>
  );
}
