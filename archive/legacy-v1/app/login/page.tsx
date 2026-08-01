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
    <AppShell header={<AppHeader title="Family Finances" subtitle="Shared household access" />}>
      <div className="mx-auto w-full max-w-md">
        <LoginForm origin={origin} />
      </div>
    </AppShell>
  );
}
