"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

/**
 * Welcome — value prop + CTAs to login/register.
 * Visual hierarchy only; same strings and routes.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const t = useTranslations("auth.welcome");
  const tCommon = useTranslations("common");

  return (
    <AuthScreenShell testId="auth-welcome" centered className="py-0">
      <div className="flex flex-col items-center gap-(--space-3) text-center">
        <BrandMark variant="soft" size="lg" className="mb-(--space-2)" />
        <Heading level={1} className="text-3xl tracking-tight">
          {t("title")}
        </Heading>
        <Text
          tone="secondary"
          size="base"
          className="max-w-[18rem] leading-relaxed"
        >
          {tCommon("tagline")}
        </Text>
      </div>

      <div className="flex w-full flex-col gap-(--space-3)">
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
    </AuthScreenShell>
  );
}
