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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-rose-600">Unexpected error</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Something went wrong while loading this page.</h1>
        <p className="mt-2 text-sm text-slate-600">No data was deleted. Please retry, then refresh if needed.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
