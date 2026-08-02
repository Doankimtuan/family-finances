"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, useRef, type ReactNode } from "react";

const STORAGE_KEY = "vinha-theme";
const TRANSITION_MS = 200;

/**
 * Briefly enables calm color transitions on intentional theme changes.
 * Skipped on first hydration paint (avoids FOUC flash) and when
 * prefers-reduced-motion is set (global CSS already zeros transitions).
 */
function ThemeTransitionBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme, theme } = useTheme();
  const mounted = useRef(false);
  const prev = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = resolvedTheme ?? theme;
      return;
    }

    const next = resolvedTheme ?? theme;
    if (!next || next === prev.current) return;
    prev.current = next;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    const id = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(id);
      root.classList.remove("theme-transitioning");
    };
  }, [resolvedTheme, theme]);

  return children;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Prevent transition flash during hydration; intentional switches
      // use ThemeTransitionBridge + .theme-transitioning instead.
      disableTransitionOnChange
      storageKey={STORAGE_KEY}
      themes={["light", "dark", "system"]}
    >
      <ThemeTransitionBridge>{children}</ThemeTransitionBridge>
    </NextThemesProvider>
  );
}

export { STORAGE_KEY as THEME_STORAGE_KEY };
