"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createSavingsAction } from "../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

function defaultMaturityDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

export function CreateSavingsForm() {
  const t = useTranslations("money.savingsPage");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [maturityDate, setMaturityDate] = useState(defaultMaturityDate);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="savings-add-open"
        isDisabled={!online}
        onPress={() => setOpen(true)}
      >
        {online ? t("add") : tErr("offline")}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="savings-add-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="savings-name"
        label={t("nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="savings-amount"
        label={t("amountLabel")}
        value={amount}
        inputMode="numeric"
        onChange={(e) => setAmount(e.target.value)}
      />
      <TextField
        id="savings-maturity"
        label={t("maturityLabel")}
        type="date"
        value={maturityDate}
        onChange={(e) => setMaturityDate(e.target.value)}
      />
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="savings-add-save"
        isDisabled={isPending || !online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          startTransition(async () => {
            const result = await createSavingsAction({
              name: name.trim(),
              principalAmount: Number(amount.replace(/\D/g, "")),
              maturityDate,
            });
            if (result.status === "success") {
              setOpen(false);
              setName("");
              setAmount("");
              setMaturityDate(defaultMaturityDate());
              router.refresh();
              return;
            }
            setErrorCode(result.code);
          });
        }}
      >
        {isPending ? t("saving") : t("save")}
      </Button>
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        onPress={() => setOpen(false)}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
