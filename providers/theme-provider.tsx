"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { THEME_MODES, type ThemeMode } from "@/shared/theme/tokens";

const STORAGE_KEY = "vinha-theme";
const TRANSITION_MS = 200;
const DEFAULT_THEME = "system" as const;
const LIGHT_THEME = "light" as const;
const DARK_THEME = "dark" as const;
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ResolvedTheme = Exclude<ThemeMode, "system">;

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeSubscribers = new Set<() => void>();
let fallbackTheme: ThemeMode | null = null;

function isThemeMode(value: string | null): value is ThemeMode {
  return typeof value === "string" && THEME_MODES.includes(value as ThemeMode);
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  if (fallbackTheme !== null) return fallbackTheme;

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME;
  } catch {
    // Keep the last in-memory choice when storage is unavailable.
    return fallbackTheme ?? DEFAULT_THEME;
  }
}

function subscribeToStoredTheme(onChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      fallbackTheme = isThemeMode(event.newValue)
        ? event.newValue
        : DEFAULT_THEME;
      onChange();
    }
  };

  themeSubscribers.add(onChange);
  window.addEventListener("storage", handleStorageChange);
  return () => {
    themeSubscribers.delete(onChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function notifyThemeSubscribers() {
  themeSubscribers.forEach((onChange) => onChange());
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return LIGHT_THEME;

  return window.matchMedia(SYSTEM_THEME_QUERY).matches
    ? DARK_THEME
    : LIGHT_THEME;
}

function subscribeToSystemTheme(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function applyTheme(theme: ResolvedTheme, transition: boolean) {
  const root = document.documentElement;
  root.classList.remove(LIGHT_THEME, DARK_THEME);
  root.classList.add(theme);
  root.style.colorScheme = theme;

  if (!transition || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return;
  }

  root.classList.add("theme-transitioning");
  window.setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, TRANSITION_MS);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToStoredTheme,
    readStoredTheme,
    (): ThemeMode => DEFAULT_THEME,
  );
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    (): ResolvedTheme => LIGHT_THEME,
  );
  const resolvedTheme = theme === DEFAULT_THEME ? systemTheme : theme;

  useEffect(() => {
    applyTheme(resolvedTheme, false);
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      fallbackTheme = null;
    } catch {
      fallbackTheme = nextTheme;
    }
    notifyThemeSubscribers();
    applyTheme(
      nextTheme === DEFAULT_THEME ? getSystemTheme() : nextTheme,
      true,
    );
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export { STORAGE_KEY as THEME_STORAGE_KEY };
