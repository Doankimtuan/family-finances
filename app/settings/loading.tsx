export default function SettingsLoading() {
  return (
    <section className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-12 animate-pulse rounded-2xl bg-white shadow-sm" />
      <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
    </section>
  );
}
