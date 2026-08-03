"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  GOAL_STATUS_VALUES,
  type GoalStatus,
} from "@/modules/plan/application/client";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { contributeToGoalAction, updateGoalAction } from "../actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  status: GoalStatus;
};

export function GoalDetailControls({
  goalId,
  name: initialName,
  targetAmount: initialTarget,
  targetDate: initialDate,
  status: initialStatus,
}: Props) {
  const t = useTranslations("plan.goals");
  const router = useRouter();
  const amountId = useId();
  const noteId = useId();
  const nameId = useId();
  const targetId = useId();
  const dateId = useId();
  const { online } = useOnlineStatusClient();
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [target, setTarget] = useState<number | null>(initialTarget);
  const [targetDate, setTargetDate] = useState(initialDate ?? "");
  const [status, setStatus] = useState(initialStatus);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const onContribute = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (amount == null || amount <= 0) {
      return;
    }
    startTransition(async () => {
      const result = await contributeToGoalAction({
        goalId,
        amount,
        note: note.trim() || undefined,
      });
      if (result.status === "success") {
        setAmount(null);
        setNote("");
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  const onSaveEdit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (target == null || target <= 0) {
      return;
    }
    startTransition(async () => {
      const result = await updateGoalAction({
        goalId,
        name: name.trim(),
        targetAmount: target,
        targetDate: targetDate || null,
        status,
      });
      if (result.status === "success") {
        setEditing(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="goal-controls">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("contributeHeading")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <Text size="sm" className="font-semibold text-text-primary">
          {t("contributeHeading")}
        </Text>
        <Text size="sm" tone="secondary">
          {t("contributeDirection")}
        </Text>
        <AmountField
          id={amountId}
          label={t("contributeAmountLabel")}
          value={amount}
          onValueChange={setAmount}
          data-testid="goal-contribute-amount"
        />
        <TextField
          id={noteId}
          label={t("contributeNoteLabel")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid="goal-contribute-submit"
          isDisabled={isPending || !online || amount == null || amount <= 0}
          onPress={onContribute}
        >
          {t("contributeSubmit")}
        </Button>
      </section>

      {editing ? (
        <div
          className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
          data-testid="goal-edit-form"
        >
          <TextField
            id={nameId}
            label={t("createNameLabel")}
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
          <label className="flex flex-col gap-(--space-2)">
            <span className="text-sm font-medium text-text-primary">
              {t("status.active")}
            </span>
            <select
              className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary"
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
            >
              {GOAL_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="primary"
            className="w-full"
            data-testid="goal-edit-submit"
            isDisabled={isPending || !online}
            onPress={onSaveEdit}
          >
            {t("editSubmit")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            isDisabled={isPending}
            onPress={() => setEditing(false)}
          >
            {t("createCancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          data-testid="goal-edit-open"
          isDisabled={!online}
          onPress={() => setEditing(true)}
        >
          {t("edit")}
        </Button>
      )}
    </div>
  );
}
