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
import { createLiabilityAction } from "../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function CreateDebtForm() {
  const t = useTranslations("money.debtsPage");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="debt-add-open"
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
      data-testid="debt-add-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="debt-name"
        label={t("nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="debt-creditor"
        label={t("creditorLabel")}
        value={creditor}
        onChange={(e) => setCreditor(e.target.value)}
      />
      <TextField
        id="debt-amount"
        label={t("amountLabel")}
        value={amount}
        inputMode="numeric"
        onChange={(e) => setAmount(e.target.value)}
      />
      <TextField
        id="debt-due-day"
        label={t("dueDayLabel")}
        value={dueDay}
        inputMode="numeric"
        onChange={(e) => setDueDay(e.target.value)}
      />
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-add-save"
        isDisabled={isPending || !online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          const principalAmount = Number(amount.replace(/\D/g, ""));
          const due =
            dueDay.trim() === "" ? null : Number(dueDay.replace(/\D/g, ""));
          startTransition(async () => {
            const result = await createLiabilityAction({
              name: name.trim(),
              creditor: creditor.trim() || undefined,
              principalAmount,
              dueDay:
                due != null && Number.isFinite(due) && due >= 1 && due <= 31
                  ? due
                  : null,
            });
            if (result.status === "success") {
              setOpen(false);
              setName("");
              setCreditor("");
              setAmount("");
              setDueDay("");
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
