import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Signed In
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Dashboard
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 sm:w-auto"
              >
                Sign Out
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
