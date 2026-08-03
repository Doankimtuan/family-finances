"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { recordInstallmentPaymentAction } from "../../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function InstallmentPayAction({ planId }: { planId: string }) {
  const t = useTranslations("money.cardDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="card-pay">
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="card-pay-cta"
        isDisabled={!online || isPending}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          startTransition(async () => {
            const result = await recordInstallmentPaymentAction({ planId });
            if (result.status === "success") {
              if (result.completed && result.inboxItemId) {
                router.push(inboxItemPath(result.inboxItemId));
                return;
              }
              router.refresh();
              return;
            }
            setErrorCode(result.code);
          });
        }}
      >
        {isPending ? t("recording") : t("recordPayment")}
      </Button>
    </div>
  );
}
