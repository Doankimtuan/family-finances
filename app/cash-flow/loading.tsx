import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function CashFlowLoading() {
  return (
    <ContentLoadingShell>
      <div className="h-56 rounded-2xl bg-card shadow-sm" />
      <div className="h-40 rounded-2xl bg-card shadow-sm" />
    </ContentLoadingShell>
  );
}
