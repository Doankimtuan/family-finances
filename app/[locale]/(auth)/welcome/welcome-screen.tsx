"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { EmptyState } from "@/shared/patterns/empty-state";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { Button } from "@/shared/ui/button";

/**
 * Welcome — value prop + CTAs to login/register (screens in later S1 stories).
 */
export function WelcomeScreen() {
  const router = useRouter();
  const t = useTranslations("auth.welcome");
  const tCommon = useTranslations("common");

  return (
    <AuthScreenShell testId="auth-welcome" centered className="py-0">
      <EmptyState
        title={t("title")}
        description={tCommon("tagline")}
        action={
          <div className="flex w-full max-w-[16rem] flex-col gap-(--space-3)">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onPress={() => router.push("/login")}
            >
              {t("login")}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onPress={() => router.push("/register")}
            >
              {t("register")}
            </Button>
          </div>
        }
      />
    </AuthScreenShell>
  );
}
