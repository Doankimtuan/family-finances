"use client";

import { SystemErrorScreen } from "@/app/[locale]/(system)/error/system-error-screen";

/**
 * Locale segment error boundary → system.error shell.
 */
export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SystemErrorScreen onRetry={reset} />;
}
