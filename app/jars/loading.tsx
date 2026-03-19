import { ContentLoadingShell } from "@/components/layout/content-loading-shell";

export default function JarsLoading() {
  return (
    <ContentLoadingShell>
        <div className="h-48 rounded-3xl bg-white" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="h-24 rounded-2xl bg-white" />
          <div className="h-24 rounded-2xl bg-white" />
          <div className="h-24 rounded-2xl bg-white" />
          <div className="h-24 rounded-2xl bg-white" />
        </div>
        <div className="h-64 rounded-2xl bg-white" />
        <div className="h-56 rounded-2xl bg-white" />
        <div className="h-72 rounded-2xl bg-white" />
    </ContentLoadingShell>
  );
}
