import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { createClient } from "@/lib/supabase/server";

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";

  return `${protocol}://${host}`;
}

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const requestHeaders = await headers();
  const origin = getOriginFromHeaders(requestHeaders);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Family Finances</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Access your household workspace</h1>
          <p className="mt-1 text-sm text-slate-600">
            Log in or create an account. Both partners can collaborate on the same financial truth.
          </p>
        </header>

        <LoginForm origin={origin} />
      </section>
    </main>
  );
}
