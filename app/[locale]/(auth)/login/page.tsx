import { Suspense } from "react";
import { redirect } from "@/i18n/navigation";
import { setLocale } from "@/i18n/set-locale";
import { resolveAuthenticatedEntryPath } from "@/modules/tenancy/application/resolve-authenticated-entry-path";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { Skeleton } from "@/shared/ui/skeleton";
import { LoginScreen } from "./login-screen";

type Props = {
  params: Promise<{ locale: string }>;
};

function LoginFallback() {
  return (
    <AuthScreenShell testId="auth-login-loading" align="start">
      <div className="flex flex-col gap-(--space-4)" aria-hidden>
        <Skeleton className="size-11 rounded-(--radius-control)" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-14 w-full rounded-(--radius-control)" />
        <Skeleton className="h-14 w-full rounded-(--radius-control)" />
        <Skeleton className="h-14 w-full rounded-(--radius-control)" />
      </div>
    </AuthScreenShell>
  );
}

export default async function LoginPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = setLocale(rawLocale);

  const authenticatedPath = await resolveAuthenticatedEntryPath();
  if (authenticatedPath) {
    return redirect({ href: authenticatedPath, locale });
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginScreen />
    </Suspense>
  );
}
