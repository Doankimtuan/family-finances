"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-rose-600">Critical error</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">The app hit an unexpected failure.</h1>
          <p className="mt-2 text-sm text-slate-600">Try again. If this persists, restart the app session.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </section>
      </body>
    </html>
  );
}
