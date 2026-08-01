"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/modules/platform/supabase/browser";
import { getSupabaseEnv } from "@/modules/platform/supabase/env";

type SupabaseContextValue = {
  client: SupabaseClient | null;
  isConfigured: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue>({
  client: null,
  isConfigured: false,
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const { isConfigured } = getSupabaseEnv();
    if (!isConfigured) {
      return { client: null, isConfigured: false };
    }
    return { client: createSupabaseBrowserClient(), isConfigured: true };
  }, []);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
