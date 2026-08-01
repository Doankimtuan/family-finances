"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SupabaseProvider } from "@/providers/supabase-provider";
import { ModalProvider } from "@/providers/modal-provider";

/**
 * Root application provider composition.
 * ToastProvider mounts inside AppViewport (not here) so toasts stay viewport-scoped.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SupabaseProvider>
          <ModalProvider>{children}</ModalProvider>
        </SupabaseProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
