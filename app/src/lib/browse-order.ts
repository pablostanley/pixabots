"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny module-level store that the browse grid publishes to, so the bot
 * detail dialog (opened via the `/browse/@modal/(..)bot/[id]` intercept)
 * can navigate prev/next through the _current grid order_ instead of
 * walking the canonical 10,752 combo index.
 *
 * The grid is random per session (and per reroll / filter), so walking
 * the visible list matches the user's mental model when paging through
 * what they're looking at.
 */

type Listener = () => void;

let currentOrder: readonly string[] = [];
const listeners = new Set<Listener>();

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Called by BrowseInner on every render; idempotent on identical lists. */
export function setBrowseOrder(ids: readonly string[]) {
  if (sameOrder(ids, currentOrder)) return;
  currentOrder = ids;
  for (const l of listeners) l();
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snapshot(): readonly string[] {
  return currentOrder;
}

const EMPTY: readonly string[] = [];

export function useBrowseOrder(): readonly string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Wraps at both ends so the arrows never dead-end. Null when `id` isn't in order. */
export function neighborInOrder(
  order: readonly string[],
  id: string,
  direction: 1 | -1
): string | null {
  const i = order.indexOf(id);
  if (i < 0) return null;
  const n = order.length;
  return order[(i + direction + n) % n];
}
