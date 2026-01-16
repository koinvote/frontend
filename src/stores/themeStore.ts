import { create } from "zustand";

export type Theme = "light" | "dark";
const THEME_KEY = "PREFERRED_THEME";

const applyTheme = (t: Theme) => {
  const el = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (t === "dark") {
    el.classList.add("dark");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#000000");
  } else {
    el.classList.remove("dark");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#ffffff");
  }
};

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  },
  init: () => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = saved ?? "dark";
    set({ theme: initial });
    applyTheme(initial);
  },
}));
