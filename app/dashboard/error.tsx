"use client";

type DashboardErrorProps = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-rose-500">Dashboard Error</p>
        <h1 className="mt-1 text-lg font-semibold text-rose-700">Unable to load dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
