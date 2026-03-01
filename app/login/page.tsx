import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "family-finances-iota.vercel.app";

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
    <AppShell header={<AppHeader title="Family Finances" />}>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Access your household workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Log in or create an account. Both partners can collaborate on the
            same financial truth.
          </p>
        </header>

        <LoginForm origin={origin} />
      </section>
    </AppShell>
  );
}
