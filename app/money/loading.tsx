import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function AccountsLoading() {
  return (
    <ContentLoadingShell>
        <div className="h-6 w-36 rounded bg-slate-300" />
        <div className="h-52 rounded-2xl bg-white" />
        <div className="h-56 rounded-2xl bg-white" />
    </ContentLoadingShell>
  );
}
