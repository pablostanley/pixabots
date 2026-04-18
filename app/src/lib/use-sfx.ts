"use client";

import { useSyncExternalStore } from "react";

const KEY = "pixabots:sfx";
const EVENT = "pixabots:sfx:change";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

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
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function blip(freq: number, duration = 0.08, wave: OscillatorType = "square") {
  const a = getCtx();
  if (!a) return;
  try {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(a.destination);
    const now = a.currentTime;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}

export function useSfx() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !enabled;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT));
    if (next) blip(660);
  };

  const play = (name: "shuffle" | "copy" | "cycle") => {
    if (!enabled) return;
    if (name === "shuffle") blip(880, 0.07);
    else if (name === "copy") blip(1320, 0.06);
    else blip(660, 0.04);
  };

  return { enabled, toggle, play };
}
