export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
      <section className="mx-auto w-full max-w-2xl animate-pulse space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
        </div>
        <div className="h-80 rounded-2xl bg-white shadow-sm" />
        <div className="h-32 rounded-2xl bg-white shadow-sm" />
        <div className="h-64 rounded-2xl bg-white shadow-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 rounded-xl bg-white shadow-sm" />
          <div className="h-11 rounded-xl bg-white shadow-sm" />
          <div className="h-11 rounded-xl bg-white shadow-sm" />
          <div className="h-11 rounded-xl bg-white shadow-sm" />
        </div>
      </section>
    </main>
  );
}
