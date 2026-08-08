"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  GoalStatus,
  type GoalStatus as GoalStatusValue,
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

type ConfirmAction =
  | typeof GoalStatus.COMPLETED
  | typeof GoalStatus.CANCELLED
  | null;

type Props = {
  goalId: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  status: GoalStatusValue;
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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [contributeReceiptAmount, setContributeReceiptAmount] = useState<
    number | null
  >(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTerminal =
    initialStatus === GoalStatus.COMPLETED ||
    initialStatus === GoalStatus.CANCELLED;
  const canMutate =
    initialStatus === GoalStatus.ACTIVE ||
    initialStatus === GoalStatus.PAUSED;

  const runStatus = (next: GoalStatusValue) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await updateGoalAction({
        goalId,
        name: initialName,
        targetAmount: initialTarget,
        targetDate: initialDate,
        status: next,
      });
      if (result.status === "success") {
        setConfirmAction(null);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  const onContribute = () => {
    setErrorCode(null);
    setContributeReceiptAmount(null);
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
        setContributeReceiptAmount(result.fundedAmount);
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
        status: initialStatus,
      });
      if (result.status === "success") {
        setEditing(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  if (confirmAction) {
    const isComplete = confirmAction === GoalStatus.COMPLETED;
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid={
          isComplete ? "goal-complete-confirm" : "goal-cancel-confirm"
        }
      >
        <StatusAlert
          variant="warning"
          title={
            isComplete ? t("completeConfirmTitle") : t("cancelConfirmTitle")
          }
          description={
            isComplete ? t("completeConfirmBody") : t("cancelConfirmBody")
          }
        />
        <Button
          variant="primary"
          className="w-full"
          data-testid={
            isComplete ? "goal-complete-confirm-yes" : "goal-cancel-confirm-yes"
          }
          isDisabled={isPending || !online}
          onPress={() => runStatus(confirmAction)}
        >
          {isComplete ? t("completeConfirmYes") : t("cancelConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={() => setConfirmAction(null)}
        >
          {t("createCancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-4)" data-testid="goal-controls">
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("contributeHeading")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {contributeReceiptAmount != null ? (
        <div data-testid="goal-contribute-receipt">
          <StatusAlert
            variant="success"
            title={t("contributeReceiptTitle")}
            description={t("contributeReceiptBody", {
              amount: String(contributeReceiptAmount),
            })}
          />
        </div>
      ) : null}

      {canMutate ? (
        <section className="flex flex-col gap-(--space-3)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("contributeHeading")}
          </Text>
          <StatusAlert
            variant="info"
            title={t("contributeProgressTitle")}
            description={t("contributeDirection")}
          />
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
      ) : null}

      {canMutate && editing ? (
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
      ) : null}

      {canMutate && !editing ? (
        <Button
          variant="secondary"
          className="w-full"
          data-testid="goal-edit-open"
          isDisabled={!online}
          onPress={() => setEditing(true)}
        >
          {t("edit")}
        </Button>
      ) : null}

      {canMutate ? (
        <div className="flex flex-col gap-(--space-2)" data-testid="goal-lifecycle">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("lifecycleHeading")}
          </Text>
          {initialStatus === GoalStatus.ACTIVE ? (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="goal-pause"
              isDisabled={isPending || !online}
              onPress={() => runStatus(GoalStatus.PAUSED)}
            >
              {t("pause")}
            </Button>
          ) : null}
          {initialStatus === GoalStatus.PAUSED ? (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="goal-resume"
              isDisabled={isPending || !online}
              onPress={() => runStatus(GoalStatus.ACTIVE)}
            >
              {t("resume")}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            className="w-full"
            data-testid="goal-complete"
            isDisabled={isPending || !online}
            onPress={() => setConfirmAction(GoalStatus.COMPLETED)}
          >
            {t("complete")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="goal-cancel"
            isDisabled={isPending || !online}
            onPress={() => setConfirmAction(GoalStatus.CANCELLED)}
          >
            {t("cancelGoal")}
          </Button>
        </div>
      ) : null}

      {isTerminal ? (
        <StatusAlert
          variant="info"
          title={t(`status.${initialStatus}`)}
          description={
            initialStatus === GoalStatus.COMPLETED
              ? t("terminalCompletedBody")
              : t("terminalCancelledBody")
          }
        />
      ) : null}
    </div>
  );
}
