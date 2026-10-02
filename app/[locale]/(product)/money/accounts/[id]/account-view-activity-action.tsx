"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { accountTransactionsHref } from "../../transactions/transactions-list-presentations";

type AccountViewActivityActionProps = {
  accountId?: string;
  testId?: string;
};

/**
 * Section action that opens the transactions list. Uses the shared Button
 * control so it is not styled as an accent text link.
 */
export function AccountViewActivityAction({
  accountId,
  testId,
}: AccountViewActivityActionProps) {
  const t = useTranslations("money.accountDetail");
  const router = useRouter();

  return (
    <Button
      variant={ButtonVariant.GHOST}
      size="sm"
      className="w-full justify-center text-accent"
      data-testid={testId}
      onPress={() => {
        router.push(
          accountId
            ? accountTransactionsHref(accountId)
            : APP_PATH.MONEY_TRANSACTIONS,
        );
      }}
    >
      {t("allActivity")}
      <AppIcon icon={ACTION_ICONS.forward} size={AppIconSize.SM} />
    </Button>
  );
}
