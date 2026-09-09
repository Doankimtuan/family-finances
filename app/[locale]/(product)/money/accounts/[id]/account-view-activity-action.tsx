"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button, ButtonVariant } from "@/shared/ui/button";

type AccountViewActivityActionProps = {
  testId?: string;
};

/**
 * Section action that opens the transactions list. Uses the shared Button
 * control so it is not styled as an accent text link.
 */
export function AccountViewActivityAction({
  testId,
}: AccountViewActivityActionProps) {
  const t = useTranslations("money.accountDetail");
  const router = useRouter();

  return (
    <Button
      variant={ButtonVariant.SECONDARY}
      size="sm"
      data-testid={testId}
      onPress={() => {
        router.push(APP_PATH.MONEY_TRANSACTIONS);
      }}
    >
      {t("viewActivity")}
    </Button>
  );
}
