export default function JarsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
      <section className="mx-auto w-full max-w-3xl animate-pulse space-y-4">
        <div className="h-6 w-56 rounded bg-slate-300" />
        <div className="h-56 rounded-2xl bg-white sm:hidden" />
        <div className="h-52 rounded-2xl bg-white" />
        <div className="h-56 rounded-2xl bg-white" />
      </section>
    </main>
  );
}
