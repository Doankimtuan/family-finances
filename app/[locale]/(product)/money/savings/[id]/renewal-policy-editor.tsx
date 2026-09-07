"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  MaturityFallbackPolicy,
  MaturityTargetMode,
  RenewalPolicy,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
  SettlementRule,
} from "@/modules/savings/application/savings-constants";
import type { RenewalConfig } from "@/modules/savings/application/savings-types";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { ChoiceTile } from "@/shared/patterns/choice-tile";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { motionTokens, useMotionPolicy } from "@/shared/motion";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { updateRenewalPolicyAction } from "../savings-actions";

type PackageOption = { id: string; packageName: string };
type AccountOption = { id: string; name: string };
type Props = {
  savingId: string;
  renewalPolicy: RenewalPolicy;
  renewalConfig: RenewalConfig;
  packages: PackageOption[];
  accounts: AccountOption[];
};
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

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

function RenewalTargetReveal({
  motionEnabled,
  show,
  children,
}: {
  motionEnabled: boolean;
  show: boolean;
  children: ReactNode;
}) {
  if (!motionEnabled) {
    return show ? (
      <div className="flex flex-col gap-(--space-2)">{children}</div>
    ) : null;
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {show ? (
        <motion.div
          key="target"
          initial={{ opacity: 0, y: motionTokens.distance.xs }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -motionTokens.distance.xs }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.easing.standard,
          }}
          className="flex flex-col gap-(--space-2)"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function RenewalPolicyEditor({
  savingId,
  renewalPolicy: initialPolicy,
  renewalConfig: initialConfig,
  packages,
  accounts,
}: Props) {
  const t = useTranslations("money.savingsDetail");
  const tErr = useTranslations("money.products.errors");
  const { online } = useOnlineStatusClient();
  const motionPolicy = useMotionPolicy();
  const [isOpen, setIsOpen] = useState(false);
  const [policy, setPolicy] = useState(initialPolicy);
  const [strategy, setStrategy] = useState(
    initialConfig.preferredSettlementRule,
  );
  const [targetMode, setTargetMode] = useState<MaturityTargetMode>(
    initialConfig.targetMode ??
      (initialConfig.preferredPackageId
        ? MaturityTargetMode.SELECT_PACKAGE
        : MaturityTargetMode.KEEP_CURRENT_PACKAGE),
  );
  const [packageId, setPackageId] = useState(
    initialConfig.targetPackageId ??
      initialConfig.preferredPackageId ??
      packages[0]?.id ??
      "",
  );
  const [accountId, setAccountId] = useState(
    initialConfig.payoutAccountId ??
      initialConfig.preferredSettlementAccountId ??
      accounts[0]?.id ??
      "",
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const needsPayout = strategy !== SettlementRule.ROLL_PRINCIPAL_INTEREST;
  const needsTarget = strategy !== SettlementRule.WITHDRAW_EVERYTHING;

  function reset() {
    setPolicy(initialPolicy);
    setStrategy(initialConfig.preferredSettlementRule);
    setTargetMode(
      initialConfig.targetMode ??
        (initialConfig.preferredPackageId
          ? MaturityTargetMode.SELECT_PACKAGE
          : MaturityTargetMode.KEEP_CURRENT_PACKAGE),
    );
    setPackageId(
      initialConfig.targetPackageId ??
        initialConfig.preferredPackageId ??
        packages[0]?.id ??
        "",
    );
    setAccountId(
      initialConfig.payoutAccountId ??
        initialConfig.preferredSettlementAccountId ??
        accounts[0]?.id ??
        "",
    );
    setErrorCode(null);
  }

  function close() {
    reset();
    setIsOpen(false);
  }

  function save() {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    startTransition(async () => {
      const result = await updateRenewalPolicyAction({
        savingId,
        renewalPolicy: policy,
        renewalConfig: {
          preferredPackageId:
            needsTarget && targetMode === MaturityTargetMode.SELECT_PACKAGE
              ? packageId
              : null,
          preferredSettlementRule: strategy,
          preferredSettlementAccountId: needsPayout ? accountId : null,
          targetMode,
          targetPackageId:
            needsTarget && targetMode === MaturityTargetMode.SELECT_PACKAGE
              ? packageId
              : null,
          payoutAccountId: needsPayout ? accountId : null,
          fallbackPolicy: MaturityFallbackPolicy.ASK_USER,
        },
      });
      if (result.status === "success") {
        close();
      } else {
        setErrorCode(result.code);
      }
    });
  }

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          reset();
          setIsOpen(true);
        } else {
          close();
        }
      }}
    >
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="savings-edit-maturity"
        onPress={() => setIsOpen(true)}
      >
        {t("editMaturity")}
      </Button>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading>{t("maturityInstructionTitle")}</Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body className="flex max-h-[70dvh] flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErr(errorCode)} />
          ) : null}
          <div
            className="flex flex-col gap-(--space-2)"
            role="group"
            aria-label={t("renewalPolicyLabel")}
          >
            <Text size="sm" weight="semibold">
              {t("renewalPolicyLabel")}
            </Text>
            {RENEWAL_POLICY_VALUES.map((value) => (
              <SelectionTile
                key={value}
                selected={policy === value}
                onPress={() => setPolicy(value)}
                testId={`savings-detail-policy-${value}`}
              >
                <Text size="sm" weight="medium">
                  {t(`renewalPolicies.${value}` as never)}
                </Text>
              </SelectionTile>
            ))}
          </div>
          <div
            className="flex flex-col gap-(--space-2)"
            role="group"
            aria-label={t("maturityStrategyLabel")}
          >
            <Text size="sm" weight="semibold">
              {t("maturityStrategyLabel")}
            </Text>
            {SETTLEMENT_RULE_VALUES.map((value) => (
              <SelectionTile
                key={value}
                selected={strategy === value}
                onPress={() => setStrategy(value)}
                testId={`savings-detail-strategy-${value}`}
              >
                <Text size="sm" weight="medium">
                  {t(`settlementRules.${value}` as never)}
                </Text>
              </SelectionTile>
            ))}
          </div>
          <RenewalTargetReveal
            motionEnabled={motionPolicy.enabled}
            show={needsTarget}
          >
            <Text size="sm" weight="semibold">
              {t("targetPackageLabel")}
            </Text>
            <SelectionTile
              selected={targetMode === MaturityTargetMode.KEEP_CURRENT_PACKAGE}
              onPress={() =>
                setTargetMode(MaturityTargetMode.KEEP_CURRENT_PACKAGE)
              }
              testId="savings-detail-target-current"
            >
              <Text size="sm" weight="medium">
                {t("keepCurrentPackage")}
              </Text>
            </SelectionTile>
            <SelectionTile
              selected={targetMode === MaturityTargetMode.SELECT_PACKAGE}
              onPress={() => setTargetMode(MaturityTargetMode.SELECT_PACKAGE)}
              testId="savings-detail-target-other"
            >
              <Text size="sm" weight="medium">
                {t("chooseOtherPackage")}
              </Text>
            </SelectionTile>
            {targetMode === MaturityTargetMode.SELECT_PACKAGE
              ? packages.map((pkg) => (
                  <SelectionTile
                    key={pkg.id}
                    selected={packageId === pkg.id}
                    onPress={() => setPackageId(pkg.id)}
                    testId={`savings-detail-target-package-${pkg.id}`}
                  >
                    <Text size="sm" weight="medium">
                      {pkg.packageName}
                    </Text>
                  </SelectionTile>
                ))
              : null}
          </RenewalTargetReveal>
          {needsPayout ? (
            <div className="flex flex-col gap-(--space-2)">
              <Text size="sm" weight="semibold">
                {t("payoutAccountLabel")}
              </Text>
              {accounts.map((account) => (
                <SelectionTile
                  key={account.id}
                  selected={accountId === account.id}
                  onPress={() => setAccountId(account.id)}
                  testId={`savings-detail-payout-${account.id}`}
                >
                  <Text size="sm" weight="medium">
                    {account.name}
                  </Text>
                </SelectionTile>
              ))}
            </div>
          ) : (
            <Text size="xs" tone="secondary">
              {t("noPayoutNeeded")}
            </Text>
          )}
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("back")}
          primaryLabel={isPending ? t("savingPolicy") : t("savePolicy")}
          primaryTestId="savings-detail-save-policy"
          isDisabled={!online}
          isPending={isPending}
          onSecondary={close}
          onPrimary={save}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
