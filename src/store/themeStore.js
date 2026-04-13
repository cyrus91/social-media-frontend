import { create } from "zustand";

const STORAGE_KEY = "nx_theme";

// Legge il tema salvato o usa la preferenza OS
const getInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

// Applica subito al caricamento (prima del primo render)
applyTheme(getInitialTheme());

const useThemeStore = create((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (theme) =>
    set(() => {
      localStorage.setItem(STORAGE_KEY, theme);
      applyTheme(theme);
      return { theme };
    }),
}));

export default useThemeStore;