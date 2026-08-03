"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createGoalAction } from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function CreateGoalForm() {
  const t = useTranslations("plan.goals");
  const router = useRouter();
  const nameId = useId();
  const targetId = useId();
  const dateId = useId();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="goal-create-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setOpen(true);
        }}
      >
        {online ? t("create") : t("errors.offline")}
      </Button>
    );
  }

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (target == null || target <= 0) {
      return;
    }
    startTransition(async () => {
      const result = await createGoalAction({
        name: name.trim(),
        targetAmount: target,
        targetDate: targetDate || null,
      });
      if (result.status === "success") {
        setOpen(false);
        setName("");
        setTarget(null);
        setTargetDate("");
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="goal-create-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("create")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <TextField
        id={nameId}
        label={t("createNameLabel")}
        placeholder={t("createNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <AmountField
        id={targetId}
        label={t("createTargetLabel")}
        value={target}
        onValueChange={setTarget}
      />
      <TextField
        id={dateId}
        label={t("createDateLabel")}
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />
      <Button
        variant="primary"
        className="w-full"
        data-testid="goal-create-submit"
        isDisabled={
          isPending ||
          !online ||
          name.trim().length < 2 ||
          target == null ||
          target <= 0
        }
        onPress={onSubmit}
      >
        {t("createSubmit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => setOpen(false)}
      >
        {t("createCancel")}
      </Button>
    </div>
  );
}
