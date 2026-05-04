"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { CACHE } from "@/lib/constants";
import type { AppLanguage } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/providers/i18n-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

type AppProvidersProps = {
  children: React.ReactNode;
  language: AppLanguage;
  locale: string;
};

export function AppProviders({
  children,
  language,
  locale,
}: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: CACHE.STALE_TIME_DEFAULT,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider language={language} locale={locale}>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
