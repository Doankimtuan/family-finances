"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";

export function InvestmentReadError() {
  const t = useTranslations("money.investments.overview");
  const router = useRouter();

  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="investment-read-error"
    >
      <StatusAlert variant="danger" title={t("loadError")} />
      <Button variant="secondary" onPress={() => router.refresh()}>
        {t("retry")}
      </Button>
    </div>
  );
}
