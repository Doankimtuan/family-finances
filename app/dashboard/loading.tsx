export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-2xl animate-pulse space-y-3">
        <div className="h-5 w-24 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-300" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-white p-4 shadow-sm" />
          ))}
        </div>
      </section>
    </main>
  );
}
