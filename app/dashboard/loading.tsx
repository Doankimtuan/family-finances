import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function DashboardLoading() {
  return (
    <ContentLoadingShell>
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
    </ContentLoadingShell>
  );
}
