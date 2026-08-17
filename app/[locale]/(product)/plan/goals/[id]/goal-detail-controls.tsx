"use client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import {
  APP_PATH,
  moneyAccountPath,
  moneyDebtPath,
  moneyInvestmentBuyPath,
  moneyInvestmentSellPath,
  moneyLoanPath,
  moneySavingsEarlyWithdrawPath,
  moneySavingsPath,
} from "@/modules/tenancy/application/app-path";
import {
  GoalFundingSourceKind,
  GoalStatus,
  GoalType,
  type GoalStatus as GoalStatusValue,
  type GoalType as GoalTypeValue,
} from "@/modules/plan/application/plan-constants";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import type { GoalFundingLink } from "@/modules/plan/application/goal-recurring-types";
import { goalFundingSourceKey } from "@/modules/plan/application/goal-funding";
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
import {
  changeGoalLifecycleAction,
  contributeToGoalAction,
  linkGoalFundingAction,
  reassignGoalFundingSourceAction,
  unlinkGoalFundingAction,
  updateGoalAction,
} from "../actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
type MoneyAction = "fund" | "withdraw";
type ConfirmAction =
  GoalStatusValue | { kind: "unlink" | "reassign"; linkId: string } | null;
type ReassignmentOption = { id: string; name: string; goalType: GoalTypeValue };
type Props = {
  goalId: string;
  name: string;
  targetAmount: number;
  fundedAmount: number;
  remainingPrincipal: number | null;
  targetDate: string | null;
  status: GoalStatusValue;
  goalType: GoalTypeValue;
  fundingLinks: GoalFundingLink[];
  fundingOptions: GoalFundingOption[];
  reassignmentOptions: ReassignmentOption[];
  isLegacyIntention: boolean;
  fundingValueStatus: string;
};

function canWithdraw(link: GoalFundingLink) {
  return (
    link.kind === GoalFundingSourceKind.SAVING ||
    link.kind === GoalFundingSourceKind.SAVINGS_ACCOUNT ||
    link.kind === GoalFundingSourceKind.HOLDING
  );
}
function moneyPath(action: MoneyAction, link: GoalFundingLink) {
  if (link.kind === GoalFundingSourceKind.SAVING)
    return action === "withdraw"
      ? moneySavingsEarlyWithdrawPath(link.sourceId)
      : moneySavingsPath(link.sourceId);
  if (link.kind === GoalFundingSourceKind.SAVINGS_ACCOUNT)
    return moneyAccountPath(link.sourceId);
  if (link.kind === GoalFundingSourceKind.HOLDING)
    return action === "withdraw"
      ? moneyInvestmentSellPath(link.sourceId)
      : moneyInvestmentBuyPath(link.sourceId);
  if (link.kind === GoalFundingSourceKind.DEBT)
    return moneyDebtPath(link.sourceId);
  return moneyLoanPath(link.sourceId);
}

export function GoalDetailControls({
  goalId,
  name: initialName,
  targetAmount: initialTarget,
  fundedAmount,
  remainingPrincipal,
  targetDate: initialDate,
  status: initialStatus,
  goalType,
  fundingLinks,
  fundingOptions,
  reassignmentOptions,
  isLegacyIntention,
  fundingValueStatus,
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
  const [picker, setPicker] = useState<MoneyAction | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const canMutate =
    initialStatus === GoalStatus.ACTIVE ||
    initialStatus === GoalStatus.PAUSED ||
    initialStatus === GoalStatus.READY;
  const isTerminal =
    initialStatus === GoalStatus.COMPLETED ||
    initialStatus === GoalStatus.CANCELLED;
  const canLegacy =
    isLegacyIntention &&
    fundingLinks.length === 0 &&
    (initialStatus === GoalStatus.ACTIVE ||
      initialStatus === GoalStatus.PAUSED);
  const belowTarget = fundedAmount < initialTarget;
  const payoffRemaining =
    goalType === GoalType.PAYOFF && (remainingPrincipal ?? 0) > 0;

  const openMoney = (action: MoneyAction, link: GoalFundingLink) => {
    setPicker(null);
    router.push(moneyPath(action, link));
  };
  const chooseMoney = (action: MoneyAction) => {
    const links =
      action === "withdraw" ? fundingLinks.filter(canWithdraw) : fundingLinks;
    if (links.length === 1) openMoney(action, links[0]);
    else setPicker(action);
  };
  const lifecycle = (action: "pause" | "resume" | "complete" | "cancel") => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await changeGoalLifecycleAction({ goalId, action });
      if (result.status === "success") {
        setConfirmAction(null);
      } else setErrorCode(result.code);
    });
  };
  const unlink = (linkId: string) =>
    startTransition(async () => {
      const result = await unlinkGoalFundingAction({ goalId, linkId });
      if (result.status === "success") {
        setConfirmAction(null);
      } else setErrorCode(result.code);
    });
  const reassign = (linkId: string) => {
    if (!destination) return;
    startTransition(async () => {
      const result = await reassignGoalFundingSourceAction({
        linkId,
        fromGoalId: goalId,
        toGoalId: destination,
      });
      if (result.status === "success") {
        setConfirmAction(null);
        setDestination(null);
      } else setErrorCode(result.code);
    });
  };
  const link = () => {
    const option = fundingOptions.find(
      (item) => goalFundingSourceKey(item) === selectedSource,
    );
    if (!option) return;
    startTransition(async () => {
      const result = await linkGoalFundingAction({
        goalId,
        sourceKind: option.kind,
        sourceId: option.sourceId,
      });
      if (result.status === "success") {
        setSelectedSource(null);
      } else setErrorCode(result.code);
    });
  };
  const contribute = () => {
    if (!online || amount == null || amount <= 0) return;
    startTransition(async () => {
      const result = await contributeToGoalAction({
        goalId,
        amount,
        note: note.trim() || undefined,
      });
      if (result.status === "success") {
        setAmount(null);
        setNote("");
        setReceipt(result.fundedAmount);
      } else setErrorCode(result.code);
    });
  };
  const saveEdit = () => {
    if (!online || target == null || target <= 0) return;
    startTransition(async () => {
      const result = await updateGoalAction({
        goalId,
        name: name.trim(),
        targetAmount: target,
        goalType,
        targetDate: targetDate || null,
        status: initialStatus,
      });
      if (result.status === "success") {
        setEditing(false);
      } else setErrorCode(result.code);
    });
  };
  if (confirmAction && typeof confirmAction === "string") {
    const complete = confirmAction === GoalStatus.COMPLETED;
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid={complete ? "goal-complete-confirm" : "goal-cancel-confirm"}
      >
        <StatusAlert
          variant="warning"
          title={complete ? t("completeConfirmTitle") : t("cancelConfirmTitle")}
          description={
            complete
              ? payoffRemaining
                ? t("completeWithRemainingBody", {
                    amount: String(remainingPrincipal),
                  })
                : belowTarget
                  ? t("completeBelowTargetBody", {
                      percent: String(
                        Math.round((fundedAmount / initialTarget) * 100),
                      ),
                    })
                  : t("completeConfirmBody")
              : t("cancelConfirmBody")
          }
        />
        <Button
          variant="primary"
          className="w-full"
          isDisabled={isPending || !online}
          onPress={() => lifecycle(complete ? "complete" : "cancel")}
        >
          {complete ? t("completeConfirmYes") : t("cancelConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onPress={() => setConfirmAction(null)}
        >
          {t("createCancel")}
        </Button>
      </div>
    );
  }
  if (confirmAction && confirmAction.kind === "unlink") {
    const source =
      fundingLinks.find((item) => item.id === confirmAction.linkId)
        ?.sourceName ?? "";
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="goal-unlink-confirm"
      >
        <StatusAlert
          variant="warning"
          title={t("unlinkConfirmTitle", { source })}
          description={t("unlinkConfirmBody")}
        />
        <Button
          variant="primary"
          className="w-full"
          isDisabled={isPending || !online}
          onPress={() => unlink(confirmAction.linkId)}
        >
          {t("unlinkConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onPress={() => setConfirmAction(null)}
        >
          {t("createCancel")}
        </Button>
      </div>
    );
  }
  if (confirmAction && confirmAction.kind === "reassign") {
    const source =
      fundingLinks.find((item) => item.id === confirmAction.linkId)
        ?.sourceName ?? "";
    const destinationName =
      reassignmentOptions.find((item) => item.id === destination)?.name ?? "";
    return (
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="goal    ssign-confirm"
      >
        <StatusAlert
          variant="info"
          title={t("reassignConfirmTitle")}
          description={t("reassignConfirmBody", {
            source,
            goal: destinationName,
          })}
        />
        {reassignmentOptions.length ? (
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-medium text-text-primary">
              {t("reassignDestinationLabel")}
            </legend>
            {reassignmentOptions.map((item) => (
              <label
                key={item.id}
                className="flex min-h-11 items-center gap-(--space-3) rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) has-[:checked]:border-accent"
              >
                <input
                  type="radio"
                  name="goal-reassign-destination"
                  checked={destination === item.id}
                  onChange={() => setDestination(item.id)}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <Text size="sm" tone="secondary">
            {t("noReassignDestinations")}
          </Text>
        )}
        <Button
          variant="primary"
          className="w-full"
          isDisabled={isPending || !online || !destination}
          onPress={() => reassign(confirmAction.linkId)}
        >
          {t("reassignConfirmYes")}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onPress={() => {
            setConfirmAction(null);
            setDestination(null);
          }}
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
          title={t("actionHeading")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      {receipt != null ? (
        <StatusAlert
          variant="success"
          title={t("contributeReceiptTitle")}
          description={t("contributeReceiptBody", { amount: String(receipt) })}
        />
      ) : null}
      {canMutate ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="goal-primary-actions"
        >
          <Text size="sm" className="font-semibold">
            {t("actionHeading")}
          </Text>
          <StatusAlert
            variant="info"
            title={t("moneyMovementTitle")}
            description={t("moneyMovementBody")}
          />
          {picker ? (
            <div
              className="flex flex-col gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-3)"
              data-testid="goal-source-picker"
            >
              <Text size="sm" className="font-semibold">
                {t("sourcePickerTitle")}
              </Text>
              {(picker === "withdraw"
                ? fundingLinks.filter(canWithdraw)
                : fundingLinks
              ).map((item) => (
                <Button
                  key={item.id}
                  variant="secondary"
                  className="w-full"
                  onPress={() => openMoney(picker, item)}
                >
                  {item.sourceName}
                </Button>
              ))}
              <Button
                variant="secondary"
                className="w-full"
                onPress={() => setPicker(null)}
              >
                {t("createCancel")}
              </Button>
            </div>
          ) : null}
          {!picker ? (
            <>
              <Button
                variant="primary"
                className="w-full"
                data-testid="goal-fund"
                isDisabled={!online || !fundingLinks.length}
                onPress={() => chooseMoney("fund")}
              >
                {goalType === GoalType.PAYOFF
                  ? t("makePayment")
                  : initialStatus === GoalStatus.READY
                    ? t("addMoreFunds")
                    : t("fundGoal")}
              </Button>
              {goalType !== GoalType.PAYOFF &&
              fundingLinks.some(canWithdraw) ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  data-testid="goal-withdraw"
                  isDisabled={!online}
                  onPress={() => chooseMoney("withdraw")}
                >
                  {t("withdrawGoal")}
                </Button>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {canMutate ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="goal-funding-sources"
        >
          <Text size="sm" className="font-semibold">
            {t("fundingHeading")}
          </Text>
          {!fundingLinks.length && !isLegacyIntention ? (
            <StatusAlert
              variant="warning"
              title={t("needsBackingTitle")}
              description={t("needsBackingBody")}
            />
          ) : null}
          {fundingLinks.length ? (
            <ul className="flex flex-col gap-(--space-3)">
              {fundingLinks.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-(--space-3) rounded-[var(--radius-control)] border border-border-subtle bg-surface p-(--space-3)"
                >
                  <div className="flex items-start justify-between gap-(--space-3)">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.sourceName}
                      </span>
                      <span className="block text-xs text-text-secondary">
                        {t(`fundingKind.${item.kind}`)}
                      </span>
                    </span>
                    <span className="text-xs text-text-secondary">
                      {t(
                        `fundingValueQuality.${item.valueStatus ?? fundingValueStatus}` as never,
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-(--space-2)">
                    <Button
                      variant="secondary"
                      onPress={() => openMoney("fund", item)}
                    >
                      {item.kind === GoalFundingSourceKind.HOLDING
                        ? t("buyMore")
                        : goalType === GoalType.PAYOFF
                          ? t("makePayment")
                          : t("fundGoal")}
                    </Button>
                    {goalType !== GoalType.PAYOFF && canWithdraw(item) ? (
                      <Button
                        variant="secondary"
                        onPress={() => openMoney("withdraw", item)}
                      >
                        {item.kind === GoalFundingSourceKind.HOLDING
                          ? t("sellInvestment")
                          : t("withdrawGoal")}
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      onPress={() =>
                        setConfirmAction({ kind: "unlink", linkId: item.id })
                      }
                    >
                      {t("unlinkFunding")}
                    </Button>
                    {reassignmentOptions.length ? (
                      <Button
                        variant="secondary"
                        onPress={() => {
                          setDestination(null);
                          setConfirmAction({
                            kind: "reassign",
                            linkId: item.id,
                          });
                        }}
                      >
                        {t("reassignFunding")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {fundingOptions.length ? (
            <fieldset className="flex flex-col gap-(--space-2)">
              <legend className="text-sm font-medium">
                {t("linkFundingSource")}
              </legend>
              {fundingOptions.map((item) => {
                const key = goalFundingSourceKey(item);
                return (
                  <label
                    key={key}
                    className="flex min-h-11 items-center gap-(--space-3) rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) has-[:checked]:border-accent"
                  >
                    <input
                      type="radio"
                      name="goal-funding-source"
                      checked={selectedSource === key}
                      onChange={() => setSelectedSource(key)}
                    />
                    <span className="text-sm">{item.name}</span>
                  </label>
                );
              })}
              <Button
                variant="secondary"
                className="w-full"
                isDisabled={!selectedSource || isPending || !online}
                onPress={link}
              >
                {t("linkFundingSubmit")}
              </Button>
            </fieldset>
          ) : !fundingLinks.length ? (
            <Text size="sm" tone="secondary">
              {t("noFundingSources")}
            </Text>
          ) : null}
        </section>
      ) : null}

      {canLegacy ? (
        <section
          className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
          data-testid="goal-legacy-contribute"
        >
          <Text size="sm" className="font-semibold">
            {t("legacyContributeHeading")}
          </Text>
          <StatusAlert
            variant="warning"
            title={t("legacyManualLabel")}
            description={t("legacyManualBody")}
          />
          <AmountField
            id={amountId}
            label={t("contributeAmountLabel")}
            value={amount}
            onValueChange={setAmount}
          />
          <TextField
            id={noteId}
            label={t("contributeNoteLabel")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            data-testid="goal-contribute-submit"
            isDisabled={!online || !amount || isPending}
            onPress={contribute}
          >
            {t("contributeSubmit")}
          </Button>
        </section>
      ) : null}
      {canMutate && editing ? (
        <section
          className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
          data-testid="goal-edit-form"
        >
          <TextField
            id={nameId}
            label={t("createNameLabel")}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            onChange={(event) => setTargetDate(event.target.value)}
          />
          <Button
            variant="primary"
            className="w-full"
            isDisabled={!online || isPending}
            onPress={saveEdit}
          >
            {t("editSubmit")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onPress={() => setEditing(false)}
          >
            {t("createCancel")}
          </Button>
        </section>
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
        <section
          className="flex flex-col gap-(--space-2)"
          data-testid="goal-lifecycle"
        >
          <Text size="sm" className="font-semibold">
            {t("lifecycleHeading")}
          </Text>
          {initialStatus === GoalStatus.PAUSED ? (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="goal-resume"
              onPress={() => lifecycle("resume")}
            >
              {t("resume")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              data-testid="goal-pause"
              onPress={() => lifecycle("pause")}
            >
              {t("pause")}
            </Button>
          )}
          <Button
            variant="primary"
            className="w-full"
            data-testid="goal-complete"
            onPress={() => setConfirmAction(GoalStatus.COMPLETED)}
          >
            {t("complete")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="goal-cancel"
            onPress={() => setConfirmAction(GoalStatus.CANCELLED)}
          >
            {t("cancelGoal")}
          </Button>
        </section>
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
      {isTerminal ? (
        <Button
          variant="secondary"
          className="w-full"
          onPress={() => router.push(APP_PATH.PLAN_GOALS)}
        >
          {t("backToList")}
        </Button>
      ) : null}
    </div>
  );
}
