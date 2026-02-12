import { create } from "zustand";

export type Theme = "light" | "dark";
const THEME_KEY = "PREFERRED_THEME";

const applyTheme = (t: Theme) => {
  const el = document.documentElement;

  if (t === "dark") {
    el.classList.add("dark");
  } else {
    el.classList.remove("dark");
  }

  // Update all theme-color meta tags for safe area coloring
  const color = t === "dark" ? "#000000" : "#ffffff";
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", color);
  });
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
    if (location.href.includes("admin")) {
      // admin 預設強制 light mode
      set({ theme: "light" });
      applyTheme("light");
      return;
    }
    set({ theme: initial });
    applyTheme(initial);
  },
}));
