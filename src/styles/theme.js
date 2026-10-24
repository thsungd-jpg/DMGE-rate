// Day / night theme store. Persisted in localStorage, defaults to the OS preference.
// Importing this module applies the theme immediately (data-theme on <html> + theme-color meta).
import { useEffect, useState } from "react";

const KEY = "dmge-theme";
const subs = new Set();

function initial() {
  // ?theme=dark|light wins (handy for sharing a link or taking screenshots)
  try {
    const q = new URLSearchParams(window.location.search).get("theme");
    if (q === "dark" || q === "light") return q;
  } catch { /* ignore */ }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

let theme = typeof window === "undefined" ? "light" : initial();

function apply() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#05030D" : "#FFF6E8");
}
apply();

export const getTheme = () => theme;

export function setTheme(next) {
  theme = next === "dark" ? "dark" : "light";
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  apply();
  subs.forEach((fn) => fn(theme));
}

export const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

export function useTheme() {
  const [t, setT] = useState(theme);
  useEffect(() => { subs.add(setT); setT(theme); return () => { subs.delete(setT); }; }, []);
  return [t, toggleTheme];
}
