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
import { createInstallmentAction } from "../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function CreateInstallmentForm() {
  const t = useTranslations("money.cardsPage");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cardLabel, setCardLabel] = useState("");
  const [total, setTotal] = useState("");
  const [each, setEach] = useState("");
  const [count, setCount] = useState("6");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="card-add-open"
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
      data-testid="card-add-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="card-name"
        label={t("nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="card-label"
        label={t("cardLabel")}
        value={cardLabel}
        onChange={(e) => setCardLabel(e.target.value)}
      />
      <TextField
        id="card-total"
        label={t("totalLabel")}
        value={total}
        inputMode="numeric"
        onChange={(e) => setTotal(e.target.value)}
      />
      <TextField
        id="card-each"
        label={t("installmentAmountLabel")}
        value={each}
        inputMode="numeric"
        onChange={(e) => setEach(e.target.value)}
      />
      <TextField
        id="card-count"
        label={t("countLabel")}
        value={count}
        inputMode="numeric"
        onChange={(e) => setCount(e.target.value)}
      />
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="card-add-save"
        isDisabled={isPending || !online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          startTransition(async () => {
            const result = await createInstallmentAction({
              name: name.trim(),
              cardLabel: cardLabel.trim() || undefined,
              totalAmount: Number(total.replace(/\D/g, "")),
              installmentAmount: Number(each.replace(/\D/g, "")),
              numInstallments: Number(count.replace(/\D/g, "")),
            });
            if (result.status === "success") {
              setOpen(false);
              setName("");
              setCardLabel("");
              setTotal("");
              setEach("");
              setCount("6");
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
