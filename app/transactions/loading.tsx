import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function TransactionsLoading() {
  return (
    <ContentLoadingShell>
        <div className="h-6 w-56 rounded bg-slate-300" />
        <div className="h-56 rounded-2xl bg-white sm:hidden" />
        <div className="h-52 rounded-2xl bg-white" />
        <div className="h-56 rounded-2xl bg-white" />
    </ContentLoadingShell>
  );
}
