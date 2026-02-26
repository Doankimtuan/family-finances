"use client";

import { Button } from "@/components/ui/button";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm" role="alert">
      <p className="text-sm font-semibold text-rose-700">Settings are temporarily unavailable.</p>
      <p className="mt-1 text-sm text-slate-600">{error.message}</p>
      <Button onClick={reset} className="mt-4" variant="destructive">
        Retry
      </Button>
    </section>
  );
}
