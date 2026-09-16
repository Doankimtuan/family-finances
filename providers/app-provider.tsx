"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { StatusAlertProvider } from "@/providers/status-alert-provider";

/**
 * Root application provider composition.
 * ToastProvider and StatusAlertHost mount inside AppViewport (not here)
 * so overlays stay viewport-scoped.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ModalProvider>
        <StatusAlertProvider>{children}</StatusAlertProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}
