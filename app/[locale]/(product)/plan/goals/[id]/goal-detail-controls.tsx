"use client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
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
import { Card } from "@/shared/patterns/card";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Text } from "@/shared/ui/text";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
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
  progressPercent: number | null;
  remainingPrincipal: number | null;
  targetDate: string | null;
  status: GoalStatusValue;
  goalType: GoalTypeValue;
  fundingLinks: GoalFundingLink[];
  fundingOptions: GoalFundingOption[];
  reassignmentOptions: ReassignmentOption[];
  isLegacyIntention: boolean;
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

function lifecycleActionForStatus(
  status: GoalStatusValue,
): Parameters<typeof changeGoalLifecycleAction>[0]["action"] {
  if (status === GoalStatus.PAUSED) return "pause";
  if (status === GoalStatus.ACTIVE) return "resume";
  if (status === GoalStatus.COMPLETED) return "complete";
  return "cancel";
}

export function GoalDetailControls({
  goalId,
  name: initialName,
  targetAmount: initialTarget,
  fundedAmount,
  progressPercent,
  remainingPrincipal,
  targetDate: initialDate,
  status: initialStatus,
  goalType,
  fundingLinks,
  fundingOptions,
  reassignmentOptions,
  isLegacyIntention,
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
  const [contributing, setContributing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [name, setName] = useState(initialName);
  const [target, setTarget] = useState<number | null>(initialTarget);
  const [targetDate, setTargetDate] = useState(initialDate ?? "");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [picker, setPicker] = useState<MoneyAction | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedMoneySourceId, setSelectedMoneySourceId] = useState<
    string | null
  >(null);
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
  const belowTarget = progressPercent != null && fundedAmount < initialTarget;
  const payoffRemaining =
    goalType === GoalType.PAYOFF && (remainingPrincipal ?? 0) > 0;

  const closeEdit = () => {
    setEditing(false);
    setName(initialName);
    setTarget(initialTarget);
    setTargetDate(initialDate ?? "");
    setErrorCode(null);
  };
  const closeContribution = () => {
    setContributing(false);
    setAmount(null);
    setNote("");
    setErrorCode(null);
  };
  const closeLink = () => {
    setLinking(false);
    setSelectedSource(null);
    setErrorCode(null);
  };
  const runMoreAction = (action: () => void) => {
    setMoreOpen(false);
    action();
  };
  const actionError = errorCode ? (
    <StatusAlert
      variant="danger"
      title={t("actionHeading")}
      description={t(`errors.${errorCode}`)}
    />
  ) : null;

  const openMoney = (action: MoneyAction, link: GoalFundingLink) => {
    setPicker(null);
    router.push(moneyPath(action, link));
  };
  const chooseMoney = (action: MoneyAction) => {
    const links =
      action === "withdraw" ? fundingLinks.filter(canWithdraw) : fundingLinks;
    if (links.length === 1) openMoney(action, links[0]);
    else {
      setSelectedMoneySourceId(null);
      setPicker(action);
    }
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
  const unlink = (linkId: string) => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await unlinkGoalFundingAction({ goalId, linkId });
      if (result.status === "success") {
        setConfirmAction(null);
      } else setErrorCode(result.code);
    });
  };
  const reassign = (linkId: string) => {
    if (!destination) return;
    setErrorCode(null);
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
    setErrorCode(null);
    startTransition(async () => {
      const result = await linkGoalFundingAction({
        goalId,
        sourceKind: option.kind,
        sourceId: option.sourceId,
      });
      if (result.status === "success") {
        setSelectedSource(null);
        setLinking(false);
      } else setErrorCode(result.code);
    });
  };
  const contribute = () => {
    if (!online || amount == null || amount <= 0) return;
    setErrorCode(null);
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
        setContributing(false);
      } else setErrorCode(result.code);
    });
  };
  const saveEdit = () => {
    if (!online || target == null || target <= 0) return;
    setErrorCode(null);
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
    const lifecycleAction = lifecycleActionForStatus(confirmAction);
    let actionLabel = t("cancelConfirmYes");
    let alertTitle = t("cancelConfirmTitle");
    let alertDescription: ReactNode = t("cancelConfirmBody");
    let confirmTestId = "goal-cancel-confirm";

    if (confirmAction === GoalStatus.PAUSED) {
      actionLabel = t("pause");
      alertTitle = actionLabel;
      alertDescription = t("moneyMovementBody");
      confirmTestId = "goal-pause-confirm";
    } else if (confirmAction === GoalStatus.ACTIVE) {
      actionLabel = t("resume");
      alertTitle = actionLabel;
      alertDescription = t("moneyMovementBody");
      confirmTestId = "goal-resume-confirm";
    } else if (complete) {
      actionLabel = t("completeConfirmYes");
      alertTitle = t("completeConfirmTitle");
      confirmTestId = "goal-complete-confirm";
      alertDescription = t("completeConfirmBody");
      if (payoffRemaining) {
        alertDescription = t.rich("completeWithRemainingBody", {
          amount: String(remainingPrincipal),
          money: (chunks: ReactNode) => (
            <FinancialValue>{chunks}</FinancialValue>
          ),
        });
      } else if (belowTarget && progressPercent != null) {
        alertDescription = t("completeBelowTargetBody", {
          percent: String(progressPercent),
        });
      }
    }
    return (
      <Sheet isOpen onOpenChange={(next) => !next && setConfirmAction(null)}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {actionLabel}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            {actionError}
            <div data-testid={confirmTestId}>
              <StatusAlert
                variant="warning"
                title={alertTitle}
                description={alertDescription}
              />
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={actionLabel}
            onSecondary={() => setConfirmAction(null)}
            onPrimary={() => lifecycle(lifecycleAction)}
            isDisabled={!online}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    );
  }
  if (confirmAction && confirmAction.kind === "unlink") {
    const source =
      fundingLinks.find((item) => item.id === confirmAction.linkId)
        ?.sourceName ?? "";
    return (
      <Sheet isOpen onOpenChange={(next) => !next && setConfirmAction(null)}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("unlinkFunding")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            {actionError}
            <div data-testid="goal-unlink-confirm">
              <StatusAlert
                variant="warning"
                title={t("unlinkConfirmTitle", { source })}
                description={t("unlinkConfirmBody")}
              />
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={t("unlinkConfirmYes")}
            onSecondary={() => setConfirmAction(null)}
            onPrimary={() => unlink(confirmAction.linkId)}
            isDisabled={!online}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    );
  }
  if (confirmAction && confirmAction.kind === "reassign") {
    const source =
      fundingLinks.find((item) => item.id === confirmAction.linkId)
        ?.sourceName ?? "";
    const destinationName =
      reassignmentOptions.find((item) => item.id === destination)?.name ?? "";
    return (
      <Sheet isOpen onOpenChange={(next) => !next && setConfirmAction(null)}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("reassignFunding")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div
              className="flex flex-col gap-(--space-4)"
              data-testid="goal-reassign-confirm"
            >
              {actionError}
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
                  <ChoiceTileGroup>
                    {reassignmentOptions.map((item) => (
                      <ChoiceTile
                        key={item.id}
                        label={item.name}
                        selected={destination === item.id}
                        onPress={() => setDestination(item.id)}
                        role="radio"
                      />
                    ))}
                  </ChoiceTileGroup>
                </fieldset>
              ) : (
                <Text size="sm" tone="secondary">
                  {t("noReassignDestinations")}
                </Text>
              )}
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("createCancel")}
            primaryLabel={t("reassignConfirmYes")}
            onSecondary={() => {
              setConfirmAction(null);
              setDestination(null);
            }}
            onPrimary={() => reassign(confirmAction.linkId)}
            isDisabled={!online}
            isPrimaryDisabled={!destination}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
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
        <div data-testid="goal-contribute-receipt">
          <StatusAlert
            variant="success"
            title={t("contributeReceiptTitle")}
            description={t("contributeReceiptBody", {
              amount: String(receipt),
            })}
          />
        </div>
      ) : null}
      {canMutate ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="goal-primary-actions"
        >
          <div className="flex items-center justify-between gap-(--space-3)">
            <div className="min-w-0">
              <Text size="sm" className="font-semibold">
                {t("actionHeading")}
              </Text>
              <Text size="xs" tone="secondary" className="mt-(--space-1)">
                {t("moneyMovementTitle")}
              </Text>
            </div>
            <IconButton
              variant="secondary"
              aria-label={t("moreActions")}
              data-testid="goal-more-actions"
              onPress={() => setMoreOpen(true)}
            >
              <AppIcon icon={ACTION_ICONS.more} size="sm" />
            </IconButton>
          </div>
          <StatusAlert
            variant="info"
            title={t("moneyMovementTitle")}
            description={t("moneyMovementBody")}
          />
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
          {picker ? (
            <Sheet isOpen onOpenChange={(next) => !next && setPicker(null)}>
              <ActionSheetLayout>
                <ActionSheetLayout.Header>
                  <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                    {t("sourcePickerTitle")}
                  </Sheet.Heading>
                </ActionSheetLayout.Header>
                <ActionSheetLayout.Body>
                  <ChoiceTileGroup>
                    {(picker === "withdraw"
                      ? fundingLinks.filter(canWithdraw)
                      : fundingLinks
                    ).map((item) => (
                      <ChoiceTile
                        key={item.id}
                        label={item.sourceName}
                        selected={selectedMoneySourceId === item.id}
                        onPress={() => setSelectedMoneySourceId(item.id)}
                        role="radio"
                        testId={`goal-source-picker-${item.id}`}
                      />
                    ))}
                  </ChoiceTileGroup>
                </ActionSheetLayout.Body>
                <SheetActionFooter
                  secondaryLabel={t("createCancel")}
                  primaryLabel={
                    picker === "withdraw" ? t("withdrawGoal") : t("fundGoal")
                  }
                  onSecondary={() => setPicker(null)}
                  onPrimary={() => {
                    const source = fundingLinks.find(
                      (item) => item.id === selectedMoneySourceId,
                    );
                    if (source) openMoney(picker, source);
                  }}
                  isPrimaryDisabled={!selectedMoneySourceId}
                />
              </ActionSheetLayout>
            </Sheet>
          ) : null}
        </section>
      ) : null}

      {canMutate && editing ? (
        <Sheet isOpen onOpenChange={(next) => !next && closeEdit()}>
          <ActionSheetLayout>
            <ActionSheetLayout.Header>
              <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                {t("edit")}
              </Sheet.Heading>
            </ActionSheetLayout.Header>
            <ActionSheetLayout.Body>
              <div
                className="flex flex-col gap-(--space-3)"
                data-testid="goal-edit-form"
              >
                {actionError}
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
              </div>
            </ActionSheetLayout.Body>
            <SheetActionFooter
              secondaryLabel={t("createCancel")}
              primaryLabel={t("editSubmit")}
              onSecondary={closeEdit}
              onPrimary={saveEdit}
              primaryTestId="goal-edit-submit"
              isDisabled={!online}
              isPrimaryDisabled={
                target == null || target <= 0 || name.trim().length < 2
              }
              isPending={isPending}
            />
          </ActionSheetLayout>
        </Sheet>
      ) : null}
      {canMutate && fundingLinks.length ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="goal-funding-sources"
        >
          <Text size="sm" className="font-semibold">
            {t("fundingHeading")}
          </Text>
          <Card tone="soft" className="gap-0 overflow-hidden p-0">
            <ul className="divide-y divide-divider">
              {fundingLinks.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-(--space-3) p-(--space-3)"
                  data-testid={`goal-funding-source-${item.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <Text size="sm" className="truncate font-medium">
                      {item.sourceName}
                    </Text>
                    <Text size="xs" tone="secondary" className="mt-(--space-1)">
                      {t(`fundingKind.${item.kind}`)}
                      {item.valueStatus
                        ? ` · ${t(
                            `fundingValueQuality.${item.valueStatus}` as never,
                          )}`
                        : ""}
                    </Text>
                  </div>
                  <AppIcon
                    icon={ACTION_ICONS.forward}
                    size="sm"
                    className="shrink-0 text-text-tertiary"
                  />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : canMutate && !isLegacyIntention ? (
        <StatusAlert
          variant="warning"
          title={t("needsBackingTitle")}
          description={t("needsBackingBody")}
        />
      ) : null}

      {canMutate ? (
        <>
          <Sheet isOpen={moreOpen} onOpenChange={setMoreOpen}>
            <ActionSheetLayout>
              <ActionSheetLayout.Header>
                <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                  {t("moreActions")}
                </Sheet.Heading>
              </ActionSheetLayout.Header>
              <ActionSheetLayout.Body>
                <div
                  className="flex flex-col gap-(--space-5)"
                  data-testid="goal-overflow-actions"
                >
                  {fundingLinks.some(canWithdraw) &&
                  goalType !== GoalType.PAYOFF ? (
                    <section
                      className="flex flex-col gap-(--space-2)"
                      data-testid="goal-funding-sources"
                    >
                      <Text
                        size="xs"
                        tone="secondary"
                        className="font-semibold"
                      >
                        {t("fundingHeading")}
                      </Text>
                      <Button
                        variant="ghost"
                        className="min-h-11 w-full justify-between px-0 text-left"
                        data-testid="goal-withdraw"
                        isDisabled={!online}
                        onPress={() =>
                          runMoreAction(() => chooseMoney("withdraw"))
                        }
                      >
                        <span>{t("withdrawGoal")}</span>
                        <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                      </Button>
                    </section>
                  ) : null}
                  {fundingOptions.length || canLegacy ? (
                    <section
                      className="flex flex-col gap-(--space-2)"
                      data-testid="goal-funding-management"
                    >
                      <Text
                        size="xs"
                        tone="secondary"
                        className="font-semibold"
                      >
                        {t("fundingHeading")}
                      </Text>
                      {fundingOptions.length ? (
                        <Button
                          variant="ghost"
                          className="min-h-11 w-full justify-between px-0 text-left"
                          data-testid="goal-link-open"
                          isDisabled={!online}
                          onPress={() =>
                            runMoreAction(() => {
                              setSelectedSource(null);
                              setLinking(true);
                            })
                          }
                        >
                          <span>{t("linkFundingSource")}</span>
                          <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                        </Button>
                      ) : null}
                      {canLegacy ? (
                        <Button
                          variant="ghost"
                          className="min-h-11 w-full justify-between px-0 text-left"
                          data-testid="goal-contribute-open"
                          isDisabled={!online}
                          onPress={() =>
                            runMoreAction(() => setContributing(true))
                          }
                        >
                          <span>{t("legacyContributeHeading")}</span>
                          <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                        </Button>
                      ) : null}
                    </section>
                  ) : null}
                  <section
                    className="flex flex-col gap-(--space-2)"
                    data-testid="goal-management-actions"
                  >
                    <Text size="xs" tone="secondary" className="font-semibold">
                      {t("edit")}
                    </Text>
                    <Button
                      variant="ghost"
                      className="min-h-11 w-full justify-between px-0 text-left"
                      data-testid="goal-edit-open"
                      isDisabled={!online}
                      onPress={() =>
                        runMoreAction(() => {
                          setName(initialName);
                          setTarget(initialTarget);
                          setTargetDate(initialDate ?? "");
                          setEditing(true);
                        })
                      }
                    >
                      <span>{t("edit")}</span>
                      <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                    </Button>
                  </section>
                  <section
                    className="flex flex-col gap-(--space-2)"
                    data-testid="goal-lifecycle"
                  >
                    <Text size="xs" tone="secondary" className="font-semibold">
                      {t("lifecycleHeading")}
                    </Text>
                    {initialStatus === GoalStatus.PAUSED ? (
                      <Button
                        variant="ghost"
                        className="min-h-11 w-full justify-between px-0 text-left"
                        data-testid="goal-resume"
                        onPress={() =>
                          runMoreAction(() =>
                            setConfirmAction(GoalStatus.ACTIVE),
                          )
                        }
                      >
                        <span>{t("resume")}</span>
                        <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="min-h-11 w-full justify-between px-0 text-left"
                        data-testid="goal-pause"
                        onPress={() =>
                          runMoreAction(() =>
                            setConfirmAction(GoalStatus.PAUSED),
                          )
                        }
                      >
                        <span>{t("pause")}</span>
                        <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="min-h-11 w-full justify-between px-0 text-left"
                      data-testid="goal-complete"
                      onPress={() =>
                        runMoreAction(() =>
                          setConfirmAction(GoalStatus.COMPLETED),
                        )
                      }
                    >
                      <span>{t("complete")}</span>
                      <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="min-h-11 w-full justify-between px-0 text-left text-danger"
                      data-testid="goal-cancel"
                      onPress={() =>
                        runMoreAction(() =>
                          setConfirmAction(GoalStatus.CANCELLED),
                        )
                      }
                    >
                      <span>{t("cancelGoal")}</span>
                      <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                    </Button>
                  </section>
                </div>
              </ActionSheetLayout.Body>
            </ActionSheetLayout>
          </Sheet>
          {fundingOptions.length ? (
            <Sheet
              isOpen={linking}
              onOpenChange={(next) => !next && closeLink()}
            >
              <ActionSheetLayout>
                <ActionSheetLayout.Header>
                  <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                    {t("linkFundingSource")}
                  </Sheet.Heading>
                </ActionSheetLayout.Header>
                <ActionSheetLayout.Body>
                  {actionError}
                  <ChoiceTileGroup>
                    {fundingOptions.map((item) => {
                      const key = goalFundingSourceKey(item);
                      return (
                        <ChoiceTile
                          key={key}
                          label={item.name}
                          selected={selectedSource === key}
                          onPress={() => setSelectedSource(key)}
                          role="radio"
                        />
                      );
                    })}
                  </ChoiceTileGroup>
                </ActionSheetLayout.Body>
                <SheetActionFooter
                  secondaryLabel={t("createCancel")}
                  primaryLabel={t("linkFundingSubmit")}
                  onSecondary={closeLink}
                  onPrimary={link}
                  primaryTestId="goal-link-submit"
                  isDisabled={!online}
                  isPrimaryDisabled={!selectedSource}
                  isPending={isPending}
                />
              </ActionSheetLayout>
            </Sheet>
          ) : null}
          {canLegacy ? (
            <Sheet
              isOpen={contributing}
              onOpenChange={(next) => !next && closeContribution()}
            >
              <ActionSheetLayout>
                <ActionSheetLayout.Header>
                  <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                    {t("legacyContributeHeading")}
                  </Sheet.Heading>
                </ActionSheetLayout.Header>
                <ActionSheetLayout.Body>
                  <div
                    className="flex flex-col gap-(--space-3)"
                    data-testid="goal-legacy-contribute"
                  >
                    {actionError}
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
                      data-testid="goal-contribute-amount"
                    />
                    <TextField
                      id={noteId}
                      label={t("contributeNoteLabel")}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </div>
                </ActionSheetLayout.Body>
                <SheetActionFooter
                  secondaryLabel={t("createCancel")}
                  primaryLabel={t("contributeSubmit")}
                  onSecondary={closeContribution}
                  onPrimary={contribute}
                  primaryTestId="goal-contribute-submit"
                  isDisabled={!online}
                  isPrimaryDisabled={!amount}
                  isPending={isPending}
                />
              </ActionSheetLayout>
            </Sheet>
          ) : null}
        </>
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
