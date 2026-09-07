"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  MaturityTargetMode,
  SettlementAction,
  SettlementRule,
  SETTLEMENT_RULE_VALUES,
} from "@/modules/savings/application/savings-constants";
import {
  calculateSettlementBreakdown,
  addSavingsTerm,
  SavingsTermUnit,
  type SavingsTaxRule,
} from "@/modules/savings/application/client";
import { renewSavingAction, settleSavingAction } from "../savings-actions";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { formatCurrency, formatDate } from "@/shared/i18n/formatters";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { Card } from "@/shared/patterns/card";
import { ChoiceTile } from "@/shared/patterns/choice-tile";
import { AppIcon } from "@/shared/ui/app-icon";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { SavingsFactRow } from "../savings-facts";

type AccountOption = { id: string; name: string };
type PackageOption = {
  id: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  termAmount?: number | null;
  termUnit?: (typeof SavingsTermUnit)[keyof typeof SavingsTermUnit] | null;
};
type Props = {
  cycleId: string;
  currentPackageId: string | null;
  currentMaturityDate: string;
  principal: number;
  grossInterest: number;
  taxRule: SavingsTaxRule;
  taxRatePercent: number;
  fee: number;
  settlementAccountId: string | null;
  accounts: AccountOption[];
  packages: PackageOption[];
  currency: string;
  targetUnavailable?: boolean;
};
type Step = "form" | "review";

function SelectionTile({
  selected,
  onPress,
  children,
  testId,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <ChoiceTile
      selected={selected}
      onPress={onPress}
      testId={testId}
      icon={null}
      className="justify-between"
    >
      {children}
      {selected ? (
        <AppIcon
          icon={CheckmarkCircle02Icon}
          size="sm"
          className="shrink-0 text-accent"
        />
      ) : null}
    </ChoiceTile>
  );
}

export function SavingsSettlementFlow({
  cycleId,
  currentPackageId,
  currentMaturityDate,
  principal,
  grossInterest,
  taxRule,
  taxRatePercent,
  fee,
  settlementAccountId,
  accounts,
  packages,
  currency,
  targetUnavailable = false,
}: Props) {
  const t = useTranslations("money.savingsSettlement");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [strategy, setStrategy] = useState<SettlementRule>(
    SettlementRule.WITHDRAW_EVERYTHING,
  );
  const [targetMode, setTargetMode] = useState<MaturityTargetMode>(
    targetUnavailable
      ? MaturityTargetMode.SELECT_PACKAGE
      : MaturityTargetMode.KEEP_CURRENT_PACKAGE,
  );
  const [targetPackageId, setTargetPackageId] = useState(
    packages[0]?.id ?? currentPackageId ?? "",
  );
  const [accountId, setAccountId] = useState(
    settlementAccountId ?? accounts[0]?.id ?? "",
  );
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const money = (value: number) =>
    formatCurrency(value, currency, locale, { maximumFractionDigits: 0 });
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const needsPayout = strategy !== SettlementRule.ROLL_PRINCIPAL_INTEREST;
  const needsTarget = strategy !== SettlementRule.WITHDRAW_EVERYTHING;
  const selectedPackage = packages.find((pkg) => pkg.id === targetPackageId);
  const newMaturityDate = selectedPackage
    ? addSavingsTerm(currentMaturityDate, {
        amount: selectedPackage.termAmount ?? selectedPackage.durationDays,
        unit: selectedPackage.termUnit ?? SavingsTermUnit.DAY,
      })
    : null;
  const formattedNewMaturityDate = newMaturityDate
    ? formatDate(new Date(`${newMaturityDate}T12:00:00`), locale)
    : null;
  const breakdown = calculateSettlementBreakdown({
    principal,
    grossInterest,
    fee,
    taxRule,
    taxRatePercent,
  });
  const projectedPrincipal =
    strategy === SettlementRule.ROLL_PRINCIPAL_INTEREST
      ? breakdown.totalCashReceived
      : principal;
  const canConfirm =
    (!needsPayout || Boolean(accountId)) &&
    (!needsTarget ||
      (targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE
        ? Boolean(currentPackageId)
        : Boolean(targetPackageId))) &&
    !isPending;

  function reset() {
    setStep("form");
    setStrategy(SettlementRule.WITHDRAW_EVERYTHING);
    setTargetMode(
      targetUnavailable
        ? MaturityTargetMode.SELECT_PACKAGE
        : MaturityTargetMode.KEEP_CURRENT_PACKAGE,
    );
    setTargetPackageId(packages[0]?.id ?? currentPackageId ?? "");
    setAccountId(settlementAccountId ?? accounts[0]?.id ?? "");
    setError(false);
  }

  function close() {
    reset();
    setOpen(false);
  }

  function confirm() {
    startTransition(async () => {
      const result =
        strategy === SettlementRule.WITHDRAW_EVERYTHING
          ? await settleSavingAction({
              cycleId,
              settlementAccountId: accountId,
            })
          : await renewSavingAction({
              cycleId,
              action:
                strategy === SettlementRule.ROLL_PRINCIPAL_ONLY
                  ? SettlementAction.ROLL_PRINCIPAL_ONLY
                  : SettlementAction.ROLL_PRINCIPAL_INTEREST,
              packageId:
                targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE
                  ? (currentPackageId ?? undefined)
                  : targetPackageId,
              settlementAccountId: needsPayout ? accountId : undefined,
            });
      if (result.status === "success") {
        close();
      } else {
        setError(true);
        setStep("form");
      }
    });
  }

  return (
    <Sheet
      isOpen={open}
      onOpenChange={(next) => {
        if (next) {
          reset();
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="savings-settle-open"
        onPress={() => setOpen(true)}
      >
        {t("open")}
      </Button>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{t("maturityTitle")}</Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body className="flex max-h-[70dvh] flex-col gap-(--space-4)">
          {error ? <StatusAlert variant="danger" title={t("error")} /> : null}
          <MotionStep
            stepKey={step}
            direction={
              step === "review"
                ? MotionStepDirection.FORWARD
                : MotionStepDirection.BACKWARD
            }
          >
            {step === "form" ? (
              <div className="flex flex-col gap-(--space-4)">
                <Text size="sm" tone="secondary">
                  {t("maturityHint")}
                </Text>
                <div
                  className="grid gap-(--space-2)"
                  role="group"
                  aria-label={t("strategyLabel")}
                >
                  {SETTLEMENT_RULE_VALUES.map((value) => (
                    <SelectionTile
                      key={value}
                      selected={strategy === value}
                      onPress={() => setStrategy(value)}
                      testId={`savings-settlement-strategy-${value}`}
                    >
                      <Text size="sm" weight="medium">
                        {t(`strategies.${value}` as never)}
                      </Text>
                    </SelectionTile>
                  ))}
                </div>
                {needsTarget ? (
                  <>
                    <Text size="sm" weight="semibold">
                      {t("targetPackage")}
                    </Text>
                    {!targetUnavailable ? (
                      <SelectionTile
                        selected={
                          targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE
                        }
                        onPress={() =>
                          setTargetMode(MaturityTargetMode.KEEP_CURRENT_PACKAGE)
                        }
                        testId="savings-settlement-target-current"
                      >
                        <Text size="sm" weight="medium">
                          {t("keepCurrentPackage")}
                        </Text>
                      </SelectionTile>
                    ) : null}
                    <SelectionTile
                      selected={
                        targetMode === MaturityTargetMode.SELECT_PACKAGE
                      }
                      onPress={() =>
                        setTargetMode(MaturityTargetMode.SELECT_PACKAGE)
                      }
                      testId="savings-settlement-target-other"
                    >
                      <Text size="sm" weight="medium">
                        {t("chooseOtherPackage")}
                      </Text>
                    </SelectionTile>
                    {targetMode === MaturityTargetMode.SELECT_PACKAGE
                      ? packages.map((pkg) => (
                          <SelectionTile
                            key={pkg.id}
                            selected={targetPackageId === pkg.id}
                            onPress={() => setTargetPackageId(pkg.id)}
                            testId={`savings-settlement-package-${pkg.id}`}
                          >
                            <span>
                              <Text size="sm" weight="medium">
                                {pkg.packageName}
                              </Text>
                              <Text size="xs" tone="secondary">
                                {t("packageMeta", {
                                  days: pkg.durationDays,
                                  rate: pkg.annualInterestRate,
                                })}
                              </Text>
                            </span>
                          </SelectionTile>
                        ))
                      : null}
                  </>
                ) : null}
                {needsPayout ? (
                  <>
                    <Text size="sm" weight="semibold">
                      {t("destination")}
                    </Text>
                    {accounts.map((account) => (
                      <SelectionTile
                        key={account.id}
                        selected={accountId === account.id}
                        onPress={() => setAccountId(account.id)}
                        testId={`savings-settlement-account-${account.id}`}
                      >
                        <Text size="sm" weight="medium">
                          {account.name}
                        </Text>
                      </SelectionTile>
                    ))}
                  </>
                ) : (
                  <Text size="xs" tone="secondary">
                    {t("noPayoutNeeded")}
                  </Text>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-(--space-4)">
                <Text size="sm" tone="secondary">
                  {t("reviewHint")}
                </Text>
                <Card tone="elevated" className="gap-0 overflow-hidden p-0">
                  <dl className="divide-y divide-divider">
                    <SavingsFactRow
                      label={t("maturedPrincipal")}
                      value={
                        <FinancialValue>{money(principal)}</FinancialValue>
                      }
                    />
                    <SavingsFactRow
                      label={t("grossInterest")}
                      value={
                        <FinancialValue>{money(grossInterest)}</FinancialValue>
                      }
                    />
                    {breakdown.tax > 0 ? (
                      <SavingsFactRow
                        label={t("tax")}
                        value={
                          <FinancialValue>
                            {money(breakdown.tax)}
                          </FinancialValue>
                        }
                      />
                    ) : null}
                    {breakdown.fee > 0 ? (
                      <SavingsFactRow
                        label={t("fee")}
                        value={
                          <FinancialValue>
                            {money(breakdown.fee)}
                          </FinancialValue>
                        }
                      />
                    ) : null}
                    {strategy === SettlementRule.ROLL_PRINCIPAL_ONLY ? (
                      <SavingsFactRow
                        label={t("payout")}
                        value={
                          <FinancialValue>
                            {money(breakdown.netInterest)}
                          </FinancialValue>
                        }
                      />
                    ) : null}
                    <SavingsFactRow
                      label={t("netInterest")}
                      value={
                        <FinancialValue>
                          {money(breakdown.netInterest)}
                        </FinancialValue>
                      }
                    />
                    <SavingsFactRow
                      label={
                        strategy === SettlementRule.WITHDRAW_EVERYTHING
                          ? t("received")
                          : t("newPrincipal")
                      }
                      value={
                        <FinancialValue>
                          {money(
                            strategy === SettlementRule.WITHDRAW_EVERYTHING
                              ? breakdown.totalCashReceived
                              : projectedPrincipal,
                          )}
                        </FinancialValue>
                      }
                      emphasis
                    />
                  </dl>
                </Card>
                {needsTarget && selectedPackage ? (
                  <div className="flex flex-col gap-(--space-1)">
                    <Text size="sm" tone="secondary">
                      {t("intoPackage", {
                        package: selectedPackage.packageName,
                      })}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {t("packageMeta", {
                        days: selectedPackage.durationDays,
                        rate: selectedPackage.annualInterestRate,
                      })}
                    </Text>
                    {formattedNewMaturityDate ? (
                      <Text size="sm" tone="secondary">
                        {t("newMaturity", { date: formattedNewMaturityDate })}
                      </Text>
                    ) : null}
                  </div>
                ) : null}
                {needsPayout ? (
                  <Text size="sm" tone="secondary">
                    {t("into", {
                      account: selectedAccount?.name ?? t("unknownAccount"),
                    })}
                  </Text>
                ) : null}
              </div>
            )}
          </MotionStep>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={step === "review" ? t("back") : t("cancel")}
          primaryLabel={
            isPending
              ? t("confirming")
              : step === "review"
                ? t("confirm")
                : t("review")
          }
          primaryTestId="savings-settlement-submit"
          isDisabled={!canConfirm}
          isPending={isPending}
          onSecondary={() => (step === "review" ? setStep("form") : close())}
          onPrimary={() => (step === "review" ? confirm() : setStep("review"))}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
