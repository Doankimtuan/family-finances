import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export default function SettingsLoading() {
  return (
    <AppShell
      header={<AppHeader title="Settings" />}
      footer={<BottomTabBar />}
    >
      <section className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="h-12 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
      </section>
    </AppShell>
  );
}
