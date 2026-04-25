import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function HouseholdLoading() {
  return (
    <ContentLoadingShell>
      <div className="h-40 rounded-2xl bg-card shadow-sm" />
      <div className="h-52 rounded-2xl bg-card shadow-sm" />
      <div className="h-44 rounded-2xl bg-card shadow-sm" />
    </ContentLoadingShell>
  );
}
