"use client";

import { SystemErrorScreen } from "@/app/[locale]/(system)/error/system-error-screen";

/** Shared recovery boundary for the high-value product route family. */
export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SystemErrorScreen onRetry={reset} />;
}
