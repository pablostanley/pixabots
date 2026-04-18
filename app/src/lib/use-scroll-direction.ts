import { useSyncExternalStore, useRef } from "react";

type State = { direction: "up" | "down"; scrolled: boolean };

const DOWN_THRESHOLD = 8;
const SCROLLED_THRESHOLD = 20;

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getSnapshot(lastY: { current: number }, last: { current: State }): State {
  const y = window.scrollY;
  const dy = y - lastY.current;
  const direction: "up" | "down" =
    Math.abs(dy) < DOWN_THRESHOLD ? last.current.direction : dy > 0 ? "down" : "up";
  const scrolled = y > SCROLLED_THRESHOLD;
  if (direction === last.current.direction && scrolled === last.current.scrolled) {
    return last.current;
  }
  lastY.current = y;
  const next: State = { direction, scrolled };
  last.current = next;
  return next;
}

const SSR_STATE: State = { direction: "up", scrolled: false };

export function useScrollDirection(): State {
  const lastY = useRef(0);
  const last = useRef<State>(SSR_STATE);
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(lastY, last),
    () => SSR_STATE
  );
}
