"use client";

import { useEffect, useEffectEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Spinner } from "@/shared/ui/spinner";
import { resolveAuthEntryAction } from "./actions";

/**
 * Brand moment while session resolves → welcome or home.
 */
export function SplashScreen() {
  const router = useRouter();
  const t = useTranslations("auth.splash");
  const tCommon = useTranslations("common");

  const resolveSession = useEffectEvent(async () => {
    const path = await resolveAuthEntryAction();
    router.replace(path);
  });

  useEffect(() => {
    void resolveSession();
  }, []);

  return (
    <div
      data-testid="auth-splash"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-(--space-5) px-(--space-4)"
    >
      <BrandMark variant="plate" size="lg" />
      <Heading level={1} className="text-3xl tracking-tight">
        {tCommon("brand")}
      </Heading>
      <Spinner aria-label={t("loadingLabel")} />
    </div>
  );
}
