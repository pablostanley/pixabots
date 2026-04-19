"use client";

import { useSyncExternalStore } from "react";
import type { PartCategory } from "@pixabots/core";

const KEY = "pixabots:sfx";
const EVENT = "pixabots:sfx:change";

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

// MIDI → Hz. A4 (MIDI 69) = 440Hz
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// C major pentatonic, two octaves — can't hit a wrong note
const PENTA_C = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

// 18-note C major pentatonic across ~3 octaves (C3 → E6). Pentatonic
// notes harmonize in any order, so random swatch taps still sound
// musical together — one unique note per background swatch.
const BG_SCALE = [
  48, 50, 52, 55, 57, // C3 D3 E3 G3 A3
  60, 62, 64, 67, 69, // C4 D4 E4 G4 A4
  72, 74, 76, 79, 81, // C5 D5 E5 G5 A5
  84, 86, 88,          // C6 D6 E6
];

// Each category gets its own pentatonic in a different register/key
// so cycling through categories sounds harmonically distinct.
const CATEGORY_SCALES: Record<PartCategory, number[]> = {
  eyes: [60, 62, 64, 67, 69, 72], // C pentatonic, low
  heads: [62, 64, 66, 69, 71, 74], // D pentatonic
  body: [65, 67, 69, 72, 74, 77], // F pentatonic
  top: [67, 69, 71, 74, 76, 79], // G pentatonic, high
};

// Module-level position trackers so successive shuffles climb a scale.
let shuffleIdx = 0;

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): boolean {
  // Default to on. User's explicit "0" preference wins; missing key = on.
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

type SynthOpts = {
  wave?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
  cutoff?: number;
  detune?: number;
  /** "plucky" = 6ms attack → 40ms decay to 55% → exp release (warm one-shots).
   *  "quick"  = 3ms attack → exp release (fast throttled pings). */
  env?: "plucky" | "quick";
};

/**
 * Oscillator → lowpass → amp envelope → destination. Used for every sound.
 * Envelope selector distinguishes warm one-shots from fast slider pings.
 */
function synth(freq: number, opts: SynthOpts = {}) {
  const a = getCtx();
  if (!a) return;
  const {
    wave = "triangle",
    dur = 0.18,
    gain = 0.05,
    delay = 0,
    cutoff = 2500,
    detune = 0,
    env = "plucky",
  } = opts;
  const now = a.currentTime + delay;
  const osc = a.createOscillator();
  const amp = a.createGain();
  const filter = a.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 0.7;
  osc.type = wave;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  osc.connect(filter);
  filter.connect(amp);
  amp.connect(a.destination);
  amp.gain.setValueAtTime(0, now);
  if (env === "plucky") {
    amp.gain.linearRampToValueAtTime(gain, now + 0.006);
    amp.gain.linearRampToValueAtTime(gain * 0.55, now + 0.04);
    amp.gain.exponentialRampToValueAtTime(0.0005, now + dur);
  } else {
    amp.gain.linearRampToValueAtTime(gain, now + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0005, now + dur);
  }
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

const voice = (midi: number, opts: SynthOpts = {}) => synth(midiToHz(midi), opts);

export type SfxEvent =
  | { kind: "shuffle" }
  | { kind: "cycle"; category: PartCategory; index: number }
  | { kind: "pick"; category: PartCategory; index: number }
  | { kind: "copy" }
  | { kind: "bg"; index: number }
  | { kind: "download" }
  | { kind: "toggle" };

function playEvent(ev: SfxEvent) {
  switch (ev.kind) {
    case "shuffle": {
      // Climb a C-pentatonic scale on each successive shuffle.
      const note = PENTA_C[shuffleIdx % PENTA_C.length];
      shuffleIdx += 1;
      voice(note, { gain: 0.055, dur: 0.2 });
      // Soft fifth underneath for body
      voice(note - 5, { gain: 0.022, dur: 0.22, delay: 0.01, cutoff: 1400 });
      return;
    }
    case "cycle":
    case "pick": {
      // Map the chosen part index onto the category's scale.
      const scale = CATEGORY_SCALES[ev.category];
      const note = scale[ev.index % scale.length];
      voice(note, { gain: 0.05, dur: 0.16 });
      return;
    }
    case "bg": {
      // Each swatch = unique note on an 18-step C-major scale.
      const safe = ((ev.index % BG_SCALE.length) + BG_SCALE.length) % BG_SCALE.length;
      const note = BG_SCALE[safe];
      voice(note, { dur: 0.14, gain: 0.04, cutoff: 2200 });
      return;
    }
    case "copy": {
      // Two-note rising minor third
      voice(72, { gain: 0.05, dur: 0.11 });
      voice(76, { gain: 0.04, delay: 0.04, dur: 0.13 });
      return;
    }
    case "download": {
      // 4-note major arpeggio jingle
      const notes = [60, 64, 67, 72];
      notes.forEach((m, i) => voice(m, { delay: i * 0.07, gain: 0.05, dur: 0.22 }));
      // Sparkle on the last note
      voice(76, { delay: 4 * 0.07, gain: 0.03, dur: 0.24 });
      return;
    }
    case "toggle": {
      voice(67, { gain: 0.045, dur: 0.1 });
      voice(74, { gain: 0.04, delay: 0.05, dur: 0.14 });
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Continuous sliders + Kaoss color picker (efecto-inspired)
// ---------------------------------------------------------------------------

// Throttle state for slider/color (module scope so calls share rate across mounts)
const SLIDER_THROTTLE_MS = 45;
const COLOR_THROTTLE_MS = 32;
let lastSliderAt = 0;
let lastColorAt = 0;

function playSliderNote(t: number) {
  const now = performance.now();
  if (now - lastSliderAt < SLIDER_THROTTLE_MS) return;
  lastSliderAt = now;
  // Map 0–1 to C4 (262) → C6 (1047) logarithmically so equal slider distance
  // = equal musical interval.
  const clamped = Math.max(0, Math.min(1, t));
  const freq = 262 * Math.pow(1047 / 262, clamped);
  synth(freq, { wave: "sine", dur: 0.05, gain: 0.05, cutoff: 2800, env: "quick" });
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return { h: 0, s: 0, v: 0 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function playColorNote(hex: string) {
  const now = performance.now();
  if (now - lastColorAt < COLOR_THROTTLE_MS) return;
  lastColorAt = now;
  const { h, s, v } = hexToHsv(hex);
  // Hue (0–360) → continuous semitone on C chromatic octave. Wraps at red.
  const semitone = (h / 360) * 12;
  const baseFreq = 262 * Math.pow(2, semitone / 12);
  // Value/brightness → octave factor 0.5 (dark) to 2 (bright).
  const octave = 0.5 + v * 1.5;
  // Saturation → volume. Greys whisper, vivid colors sing.
  const gain = 0.01 + s * 0.07;
  const freq = baseFreq * octave;
  // Main tone + a softer 2× harmonic for that Kaoss-pad shimmer.
  synth(freq, { wave: "sine", dur: 0.035, gain, cutoff: 3200, env: "quick" });
  synth(freq * 2, { wave: "sine", dur: 0.025, gain: gain * 0.4, cutoff: 3200, env: "quick" });
}

export function useSfx() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !enabled;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT));
    if (next) playEvent({ kind: "toggle" });
  };

  const play = (ev: SfxEvent) => {
    if (!enabled) return;
    playEvent(ev);
  };

  const playSlider = (t: number) => {
    if (!enabled) return;
    playSliderNote(t);
  };

  const playColor = (hex: string) => {
    if (!enabled) return;
    playColorNote(hex);
  };

  return { enabled, toggle, play, playSlider, playColor };
}
