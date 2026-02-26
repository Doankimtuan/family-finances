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
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">Decision tools are temporarily unavailable.</p>
        <p className="mt-1 text-sm text-slate-600">Retry to restore calculations and scenario comparison.</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Retry</button>
      </section>
    </main>
  );
}
