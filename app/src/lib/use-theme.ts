import { useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";
const EVENT = "pixabots:theme";

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
  return true;
}

export function useTheme(): [dark: boolean, toggle: () => void] {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new CustomEvent(EVENT));
  };

  return [dark, toggle];
}
