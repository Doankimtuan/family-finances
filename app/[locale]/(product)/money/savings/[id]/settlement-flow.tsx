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
import { renewSavingAction, settleSavingAction } from "../savings-actions";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import { formatCurrency } from "@/shared/i18n/formatters";
import { AppIcon } from "@/shared/ui/app-icon";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";

type AccountOption = { id: string; name: string };
type PackageOption = {
  id: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
};
type Props = {
  cycleId: string;
  currentPackageId: string | null;
  principal: number;
  grossInterest: number;
  tax: number;
  fee: number;
  totalCashReceived: number;
  settlementAccountId: string | null;
  accounts: AccountOption[];
  packages: PackageOption[];
  currency: string;
  targetUnavailable?: boolean;
};
type Step = "form" | "review";

function Card({
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
    <button
      type="button"
      aria-pressed={selected}
      data-testid={testId}
      onClick={onPress}
      className={`flex min-h-11 w-full items-center justify-between gap-(--space-3) rounded-[var(--radius-control)] border px-(--space-3) py-(--space-3) text-left focus-visible:outline-2 focus-visible:outline-focus-ring ${selected ? "border-accent bg-accent-soft" : "border-border-subtle bg-surface hover:border-accent/50"}`}
    >
      {children}
      {selected ? (
        <AppIcon
          icon={CheckmarkCircle02Icon}
          size="sm"
          className="shrink-0 text-accent"
        />
      ) : null}
    </button>
  );
}

export function SavingsSettlementFlow({
  cycleId,
  currentPackageId,
  principal,
  grossInterest,
  tax,
  fee,
  totalCashReceived,
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
  const netInterest = Math.max(grossInterest - tax - fee, 0);
  const projectedPrincipal =
    strategy === SettlementRule.ROLL_PRINCIPAL_INTEREST
      ? principal + netInterest
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
      <SheetContent>
        <Sheet.Header>
          <Sheet.Heading>{t("maturityTitle")}</Sheet.Heading>
        </Sheet.Header>
        <Sheet.Body className="flex max-h-[70dvh] flex-col gap-(--space-4) overflow-y-auto">
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
                    <Card
                      key={value}
                      selected={strategy === value}
                      onPress={() => setStrategy(value)}
                      testId={`savings-settlement-strategy-${value}`}
                    >
                      <Text size="sm" weight="medium">
                        {t(`strategies.${value}` as never)}
                      </Text>
                    </Card>
                  ))}
                </div>
                {needsTarget ? (
                  <>
                    <Text size="sm" weight="semibold">
                      {t("targetPackage")}
                    </Text>
                    {!targetUnavailable ? (
                      <Card
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
                      </Card>
                    ) : null}
                    <Card
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
                    </Card>
                    {targetMode === MaturityTargetMode.SELECT_PACKAGE
                      ? packages.map((pkg) => (
                          <Card
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
                          </Card>
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
                      <Card
                        key={account.id}
                        selected={accountId === account.id}
                        onPress={() => setAccountId(account.id)}
                        testId={`savings-settlement-account-${account.id}`}
                      >
                        <Text size="sm" weight="medium">
                          {account.name}
                        </Text>
                      </Card>
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
                <dl className="divide-y divide-border-subtle/70">
                  <div className="flex justify-between gap-(--space-3) py-(--space-2)">
                    <dt className="text-sm text-text-secondary">
                      {t("principal")}
                    </dt>
                    <dd className="text-sm font-medium">{money(principal)}</dd>
                  </div>
                  <div className="flex justify-between gap-(--space-3) py-(--space-2)">
                    <dt className="text-sm text-text-secondary">
                      {t("grossInterest")}
                    </dt>
                    <dd className="text-sm font-medium">
                      {money(grossInterest)}
                    </dd>
                  </div>
                  {tax > 0 ? (
                    <div className="flex justify-between gap-(--space-3) py-(--space-2)">
                      <dt className="text-sm text-text-secondary">
                        {t("tax")}
                      </dt>
                      <dd className="text-sm font-medium">{money(tax)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-(--space-3) py-(--space-3)">
                    <dt className="text-sm font-semibold">
                      {strategy === SettlementRule.WITHDRAW_EVERYTHING
                        ? t("received")
                        : t("newPrincipal")}
                    </dt>
                    <dd className="text-base font-semibold text-accent">
                      {money(
                        strategy === SettlementRule.WITHDRAW_EVERYTHING
                          ? totalCashReceived
                          : projectedPrincipal,
                      )}
                    </dd>
                  </div>
                </dl>
                {needsTarget && selectedPackage ? (
                  <Text size="sm" tone="secondary">
                    {t("intoPackage", { package: selectedPackage.packageName })}
                  </Text>
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
        </Sheet.Body>
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
      </SheetContent>
    </Sheet>
  );
}
