"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/patterns/error-state";

export function InvestmentReadError() {
  const t = useTranslations("money.investments.overview");
  const router = useRouter();

  return (
    <div data-testid="investment-read-error">
      <ErrorState
        title={t("loadError")}
        className="flex-none py-(--space-4)"
        action={
          <Button variant="secondary" onPress={() => router.refresh()}>
            {t("retry")}
          </Button>
        }
      />
    </div>
  );
}
