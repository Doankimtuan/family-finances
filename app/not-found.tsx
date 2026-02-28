import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Not found
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            This page does not exist.
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use dashboard navigation to return to your household workspace.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
