"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-destructive">Unexpected error</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Something went wrong while loading this page.</h1>
        <p className="mt-2 text-sm text-muted-foreground">No data was deleted. Please retry, then refresh if needed.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
