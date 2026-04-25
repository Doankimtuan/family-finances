"use client";

export default function DecisionToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-destructive">Decision tools are temporarily unavailable.</p>
        <p className="mt-1 text-sm text-muted-foreground">Retry to restore calculations and scenario comparison.</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
      </section>
    </main>
  );
}
