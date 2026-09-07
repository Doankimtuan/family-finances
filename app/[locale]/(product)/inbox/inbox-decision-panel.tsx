"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { CaptureJarOption } from "@/modules/ledger/application/client";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import {
  InboxItemKind,
  InboxReceiptKind,
  INBOX_RECEIPT_QUERY,
  SavingsMaturityAckAction,
  EarlyWithdrawalAckAction,
  EmiAckAction,
  isJarResolvableKind,
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  INBOX_OPERATION,
  INBOX_TEST_ID,
  inboxAckTestId,
  type InboxAckAction,
  type InboxReceiptKind as InboxReceiptKindType,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import type { InboxCommandErrorCode } from "@/modules/inbox/application";
import {
  acknowledgeSavingsMaturityAction,
  acknowledgeEarlyWithdrawalAction,
} from "../money/savings/savings-actions";
import {
  SettlementRule,
  RenewalSuggestedAction,
  RenewalPolicy,
  RecommendationReasonCode,
} from "@/modules/savings/application/savings-constants";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Card } from "@/shared/patterns/card";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { StatusAlert } from "@/shared/ui/status-alert";
import { SelectField } from "@/shared/ui/form";
import {
  BottomActionBar,
  BottomActionBarLayout,
} from "@/shared/patterns/bottom-action-bar";
import { InboxFactRow } from "./inbox-facts";
import { InboxSectionTitle } from "./inbox-section-title";
import {
  INBOX_MATURITY_ACTION_LABEL,
  inboxMaturitySecondaryActions,
  isInboxMaturityReminder,
  isMaturityMoneyMovingAction,
  resolveInboxMaturityPrimaryAction,
  type InboxMaturityMoneyAction,
} from "./inbox-maturity-layout";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
} from "@/modules/tenancy/application/product-action-error";
import {
  resolveInboxAction,
  dismissInboxAction,
  acknowledgeInboxAction,
} from "./actions";

type Props = {
  item: InboxReviewItem;
  jars: CaptureJarOption[];
  meta?: ReactNode;
};

type InboxErrorCode =
  InboxCommandErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type PendingAction = "resolve" | "dismiss" | "ack";

/**
 * Resolve / dismiss / acknowledge — partner-equal, offline fail-closed
 * (ST-E06-002). Only canonical kinds reach this panel; an item without a
 * canonical kind renders a dismiss-only guard.
 */
export function InboxDecisionPanel({ item, jars, meta }: Props) {
  const t = useTranslations("inbox");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const suggested =
    item.suggestedJarId && jars.some((jar) => jar.id === item.suggestedJarId)
      ? item.suggestedJarId
      : (jars[0]?.id ?? "");
  const [jarId, setJarId] = useState(suggested);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [errorCode, setErrorCode] = useState<InboxErrorCode | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const kind = item.kind;
  const jarResolvable = kind != null && isJarResolvableKind(kind);
  const isMaturity = kind === InboxItemKind.SAVINGS_MATURITY;
  const isEarlyWithdrawal =
    kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION;
  const isEmi = kind === InboxItemKind.EMI_COMPLETE;
  const isEmergency = kind === InboxItemKind.EMERGENCY_DECLARATION;
  const maturityPayload =
    item.typed?.type === InboxItemKind.SAVINGS_MATURITY
      ? item.typed.payload
      : null;
  const earlyPayload =
    item.typed?.type === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION
      ? item.typed.payload
      : null;

  const [selectedPackageId, setSelectedPackageId] = useState(
    maturityPayload?.preselectedPackageId ??
      maturityPayload?.recommendedPackages[0]?.packageId ??
      "",
  );
  const [selectedSettlementRule, setSelectedSettlementRule] = useState(
    maturityPayload?.preselectedSettlementRule ??
      maturityPayload?.settlementRule ??
      SettlementRule.ROLL_PRINCIPAL_INTEREST,
  );

  if (item.capability !== InboxSourceCapability.ACTIONABLE) {
    return (
      <StatusAlert
        variant="info"
        title={
          item.capability === InboxSourceCapability.READ_ONLY_FORMER_OWNER
            ? t("ownerUnavailableTitle")
            : item.capability === InboxSourceCapability.READ_ONLY_NON_OWNER
              ? t("ownerRequiredTitle")
              : t("sourceUnavailableTitle")
        }
        description={
          item.capability === InboxSourceCapability.READ_ONLY_FORMER_OWNER
            ? t("ownerUnavailableBody")
            : item.capability === InboxSourceCapability.READ_ONLY_NON_OWNER
              ? t("ownerRequiredBody")
              : t("sourceUnavailableBody")
        }
      />
    );
  }

  const showPatternSuggestion =
    jarResolvable &&
    item.suggestedJarId != null &&
    item.confidenceScore != null;
  const busy = pendingAction != null;

  const suggestedAction =
    maturityPayload?.suggestedAction ?? RenewalSuggestedAction.NONE;
  const isMaturityReminder = isInboxMaturityReminder(
    maturityPayload?.cascadeDay,
    maturityPayload?.maturityDate,
  );
  const maturityPrimaryAction = resolveInboxMaturityPrimaryAction(
    suggestedAction,
    isMaturityReminder,
  );
  const maturitySecondaryActions = inboxMaturitySecondaryActions(
    maturityPrimaryAction,
  );

  const policyLabelKey = (() => {
    const raw =
      maturityPayload?.renewalPolicy ??
      maturityPayload?.configuredRenewalPreference ??
      RenewalPolicy.ALWAYS_ASK;
    switch (raw) {
      case RenewalPolicy.USE_SAVED_PREFERENCE:
        return "renewalPolicies.use_saved_preference" as const;
      case RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED:
        return "renewalPolicies.auto_renew_until_cancelled" as const;
      case RenewalPolicy.ONE_TIME_RENEWAL:
        return "renewalPolicies.one_time_renewal" as const;
      case RenewalPolicy.ALWAYS_ASK:
      default:
        return "renewalPolicies.always_ask" as const;
    }
  })();

  const reasonLabel = (code: string | undefined) => {
    switch (code) {
      case RecommendationReasonCode.HIGHER_RETURN:
        return t("recommendationReasons.higher_return");
      case RecommendationReasonCode.BETTER_LIQUIDITY:
        return t("recommendationReasons.better_liquidity");
      case RecommendationReasonCode.LONGER_DURATION:
        return t("recommendationReasons.longer_duration");
      case RecommendationReasonCode.PACKAGE_UNAVAILABLE:
        return t("recommendationReasons.package_unavailable");
      case RecommendationReasonCode.RATE_CHANGED:
        return t("recommendationReasons.rate_changed");
      default:
        return null;
    }
  };

  const goToQueueReceipt = (receipt: InboxReceiptKindType) => {
    // Replace only — avoid push+refresh loops that leave the UI hanging.
    router.replace(`${APP_PATH.INBOX}?${INBOX_RECEIPT_QUERY}=${receipt}`);
  };

  const run = (
    action: PendingAction,
    fn: () => Promise<
      { status: "success" } | { status: "error"; code: InboxCommandErrorCode }
    >,
    receipt: InboxReceiptKindType,
  ) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    setPendingAction(action);
    void (async () => {
      try {
        const result = await fn();
        if (result.status === "success") {
          goToQueueReceipt(receipt);
          return;
        }
        setErrorCode(result.code);
        setPendingAction(null);
      } catch (error) {
        console.error({ operation: INBOX_OPERATION.DECISION_PANEL, error });
        setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
        setPendingAction(null);
      }
    })();
  };

  const onResolve = () => {
    if (!jarId) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    run(
      "resolve",
      () => resolveInboxAction({ inboxItemId: item.id, jarId }),
      InboxReceiptKind.JAR,
    );
  };

  const onDismiss = () => {
    run(
      "dismiss",
      () => dismissInboxAction({ inboxItemId: item.id }),
      InboxReceiptKind.ATTENTION,
    );
  };

  const onAck = (action: InboxAckAction) => {
    run(
      "ack",
      () => acknowledgeInboxAction({ inboxItemId: item.id, action }),
      InboxReceiptKind.ATTENTION,
    );
  };

  const onSavingsMaturityAck = (action: SavingsMaturityAckAction) => {
    if (!maturityPayload) {
      onAck(action);
      return;
    }
    const ruleForAction =
      action === SavingsMaturityAckAction.WITHDRAW
        ? SettlementRule.WITHDRAW_EVERYTHING
        : selectedSettlementRule;
    const moneyMoving = isMaturityMoneyMovingAction(action);
    run(
      "ack",
      () =>
        acknowledgeSavingsMaturityAction({
          inboxItemId: item.id,
          action,
          cycleId: maturityPayload.cycleId,
          savingId: maturityPayload.savingId,
          settlementRule: ruleForAction,
          packageId: selectedPackageId || undefined,
          settlementAccountId:
            maturityPayload.preselectedSettlementAccountId ?? undefined,
        }),
      moneyMoving ? InboxReceiptKind.SAVINGS : InboxReceiptKind.ATTENTION,
    );
  };

  const onEarlyWithdrawAck = (action: EarlyWithdrawalAckAction) => {
    if (!earlyPayload) {
      onAck(action);
      return;
    }
    run(
      "ack",
      () =>
        acknowledgeEarlyWithdrawalAction({
          inboxItemId: item.id,
          action,
          savingId: earlyPayload.savingId,
          cycleId: earlyPayload.cycleId,
        }),
      action === EarlyWithdrawalAckAction.CONFIRM
        ? InboxReceiptKind.SAVINGS
        : InboxReceiptKind.ATTENTION,
    );
  };

  const renderMaturityAckButton = (
    action:
      | InboxMaturityMoneyAction
      | typeof SavingsMaturityAckAction.REMIND_TOMORROW,
    variant:
      | typeof ButtonVariant.PRIMARY
      | typeof ButtonVariant.SECONDARY
      | typeof ButtonVariant.GHOST,
    className = "w-full",
  ) => (
    <Button
      key={action}
      variant={variant}
      className={className}
      data-testid={inboxAckTestId(action)}
      isDisabled={busy || !online}
      onPress={() => onSavingsMaturityAck(action)}
    >
      {t(INBOX_MATURITY_ACTION_LABEL[action])}
    </Button>
  );

  const deferActions = (
    <div className="flex flex-col gap-(--space-2)">
      {!confirmDismiss &&
      isMaturity &&
      maturityPrimaryAction !== SavingsMaturityAckAction.REMIND_TOMORROW
        ? renderMaturityAckButton(
            SavingsMaturityAckAction.REMIND_TOMORROW,
            ButtonVariant.GHOST,
          )
        : null}
      {!confirmDismiss && isEarlyWithdrawal ? (
        <Button
          variant={ButtonVariant.GHOST}
          className="w-full"
          data-testid={INBOX_TEST_ID.ACK_CANCEL_EARLY}
          isDisabled={busy || !online}
          onPress={() => onEarlyWithdrawAck(EarlyWithdrawalAckAction.CANCEL)}
        >
          {t("earlyWithdrawalCancel")}
        </Button>
      ) : null}
      {!confirmDismiss && isEmi ? (
        <Button
          variant={ButtonVariant.GHOST}
          className="w-full"
          data-testid={INBOX_TEST_ID.ACK_LATER}
          isDisabled={busy || !online}
          onPress={() => onAck(EmiAckAction.LATER)}
        >
          {t("emiLater")}
        </Button>
      ) : null}
      {confirmDismiss ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid={INBOX_TEST_ID.DISMISS_CONFIRM}
        >
          <StatusAlert
            variant="warning"
            title={t("dismissConfirmTitle")}
            description={t("dismissConfirmBody")}
          />
        </div>
      ) : (
        <Button
          variant={ButtonVariant.GHOST}
          className="w-full"
          data-testid={INBOX_TEST_ID.DISMISS}
          isDisabled={busy || !online}
          onPress={() => {
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            setConfirmDismiss(true);
          }}
        >
          {t("dismiss")}
        </Button>
      )}
    </div>
  );

  let stickyBar: ReactNode = null;
  if (confirmDismiss) {
    stickyBar = (
      <BottomActionBar layout={BottomActionBarLayout.SPLIT}>
        <Button
          variant={ButtonVariant.SECONDARY}
          className="w-full"
          isDisabled={busy}
          onPress={() => setConfirmDismiss(false)}
        >
          {t("cancel")}
        </Button>
        <Button
          variant={ButtonVariant.PRIMARY}
          className="w-full"
          data-testid={INBOX_TEST_ID.DISMISS_YES}
          isDisabled={busy || !online}
          onPress={onDismiss}
        >
          {pendingAction === "dismiss"
            ? t("dismissing")
            : t("dismissConfirmYes")}
        </Button>
      </BottomActionBar>
    );
  } else if (jarResolvable) {
    stickyBar = (
      <BottomActionBar>
        <Button
          variant={ButtonVariant.PRIMARY}
          className="w-full"
          data-testid="inbox-resolve"
          isDisabled={busy || !online || jars.length === 0}
          onPress={onResolve}
        >
          {pendingAction === "resolve" ? t("resolving") : t("resolve")}
        </Button>
      </BottomActionBar>
    );
  } else if (isMaturity) {
    stickyBar = (
      <BottomActionBar>
        {renderMaturityAckButton(maturityPrimaryAction, ButtonVariant.PRIMARY)}
      </BottomActionBar>
    );
  } else if (isEarlyWithdrawal) {
    stickyBar = (
      <BottomActionBar>
        <Button
          variant={ButtonVariant.PRIMARY}
          className="w-full"
          data-testid={INBOX_TEST_ID.ACK_CONFIRM_EARLY}
          isDisabled={busy || !online}
          onPress={() => onEarlyWithdrawAck(EarlyWithdrawalAckAction.CONFIRM)}
        >
          {t("earlyWithdrawalConfirm")}
        </Button>
      </BottomActionBar>
    );
  } else if (isEmi) {
    stickyBar = (
      <BottomActionBar>
        <Button
          variant={ButtonVariant.PRIMARY}
          className="w-full"
          data-testid={INBOX_TEST_ID.ACK_CELEBRATE}
          isDisabled={busy || !online}
          onPress={() => onAck(EmiAckAction.CELEBRATE)}
        >
          {t("emiCelebrate")}
        </Button>
      </BottomActionBar>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid={INBOX_TEST_ID.DECISION_PANEL}
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {jarResolvable ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-resolve-panel"
        >
          <InboxSectionTitle>{t("resolveHeading")}</InboxSectionTitle>
          <Text size="sm" tone="secondary">
            {t("activeJarOnlyHint")}
          </Text>
          <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
            <StatusAlert
              variant="info"
              title={t("resolveMoneySafeTitle")}
              description={t("resolveMoneySafeBody")}
            />

            {jars.length === 0 ? (
              <StatusAlert
                variant="warning"
                title={t("noJarsTitle")}
                description={t("noJarsBody")}
              />
            ) : (
              <SelectField
                id="inbox-jar-select"
                label={t("jarLabel")}
                value={jarId}
                options={jars.map((jar) => ({
                  id: jar.id,
                  label: `${localizeCatalogName(tCatalog, "jars", jar.name)}${jar.id === item.suggestedJarId ? ` — ${t("suggestedSuffix")}` : ""}`,
                }))}
                onChange={setJarId}
                isDisabled={busy}
                required
                data-testid="inbox-jar-select"
                description={
                  showPatternSuggestion
                    ? t("patternSuggestionBody", {
                        confidence: Math.round(
                          (item.confidenceScore ?? 0) * 100,
                        ),
                        threshold: Math.round(
                          AUTO_RESOLVE_CONFIDENCE_THRESHOLD * 100,
                        ),
                      })
                    : undefined
                }
              />
            )}
          </Card>
        </section>
      ) : null}

      {isMaturity ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-maturity-panel"
        >
          <InboxSectionTitle>{t("maturityHeading")}</InboxSectionTitle>
          <Text size="sm" tone="secondary">
            {t(isMaturityReminder ? "maturityReminderHint" : "maturityHint")}
          </Text>
          <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
            <Text size="sm" tone="secondary" className="text-pretty">
              {t("maturitySourceBody")}
            </Text>
            {isMaturityReminder ? (
              <StatusAlert
                variant="info"
                title={t("maturityReminderTitle")}
                description={t("maturityReminderBody")}
              />
            ) : null}
            {maturityPayload ? (
              <dl className="-mx-(--space-4) divide-y divide-border-subtle/65 border-y border-border-subtle/65">
                <InboxFactRow
                  label={t("factProvider")}
                  value={`${maturityPayload.providerName} · ${maturityPayload.currentPackage}`}
                />
                <InboxFactRow
                  label={t("factRate")}
                  value={`${maturityPayload.currentRate}% · ${t(policyLabelKey)}`}
                />
                {maturityPayload.recommendationReason
                  ? (() => {
                      const label = reasonLabel(
                        maturityPayload.recommendationReason,
                      );
                      return label ? (
                        <InboxFactRow
                          label={t("factRecommendation")}
                          value={label}
                        />
                      ) : null;
                    })()
                  : null}
              </dl>
            ) : null}
            {maturityPayload?.warnings &&
            maturityPayload.warnings.length > 0 ? (
              <StatusAlert
                variant="warning"
                title={t("maturityWarningsTitle")}
                description={maturityPayload.warnings
                  .map((w) => t(`maturityWarnings.${w.code}`))
                  .join(" · ")}
              />
            ) : null}
            {maturityPayload &&
            !isMaturityReminder &&
            maturityPayload.recommendedPackages.length > 0 ? (
              <SelectField
                id="inbox-maturity-package"
                label={t("maturityPackageLabel")}
                value={selectedPackageId}
                options={maturityPayload.recommendedPackages.map((pkg) => {
                  const reason = reasonLabel(pkg.reasonCode);
                  return {
                    id: pkg.packageId,
                    label: `${pkg.packageName} · ${pkg.annualRate}% · ${pkg.durationDays}d${reason ? ` — ${reason}` : ""}`,
                  };
                })}
                onChange={(next) => setSelectedPackageId(next)}
                isDisabled={busy}
                required
                data-testid="inbox-maturity-package"
              />
            ) : null}
            {maturityPayload && !isMaturityReminder ? (
              <SelectField
                id="inbox-maturity-settlement"
                label={t("maturitySettlementLabel")}
                value={selectedSettlementRule}
                options={[
                  {
                    id: SettlementRule.ROLL_PRINCIPAL_INTEREST,
                    label: t("maturityRenew"),
                  },
                  {
                    id: SettlementRule.ROLL_PRINCIPAL_ONLY,
                    label: t("maturityRollPrincipalOnly"),
                  },
                  {
                    id: SettlementRule.WITHDRAW_EVERYTHING,
                    label: t("maturityWithdraw"),
                  },
                ]}
                onChange={(next) => setSelectedSettlementRule(next)}
                isDisabled={busy}
                required
                data-testid="inbox-maturity-settlement"
              />
            ) : null}
          </Card>
          {maturitySecondaryActions.length > 0 ? (
            <div className="grid grid-cols-2 gap-(--space-2)">
              {maturitySecondaryActions.map((action) =>
                renderMaturityAckButton(action, ButtonVariant.SECONDARY),
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {isEarlyWithdrawal ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-early-withdrawal-panel"
        >
          <InboxSectionTitle>{t("earlyWithdrawalHeading")}</InboxSectionTitle>
          <Text size="sm" tone="secondary">
            {t("earlyWithdrawalHint")}
          </Text>
          <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
            <Text size="sm" tone="secondary" className="text-pretty">
              {t("earlyWithdrawalSourceBody")}
            </Text>
            {earlyPayload ? (
              <dl className="-mx-(--space-4) divide-y divide-border-subtle/65 border-y border-border-subtle/65">
                <InboxFactRow
                  label={t("earlyWithdrawalNetLabel")}
                  value={
                    <FinancialValue>
                      {formatCurrency(
                        earlyPayload.netReturned,
                        DEFAULT_CURRENCY,
                        locale,
                        {
                          maximumFractionDigits: 0,
                        },
                      )}
                    </FinancialValue>
                  }
                />
                <InboxFactRow
                  label={t("earlyWithdrawalPenaltyLabel")}
                  value={
                    <FinancialValue>
                      {formatCurrency(
                        earlyPayload.penaltyAmount,
                        DEFAULT_CURRENCY,
                        locale,
                        {
                          maximumFractionDigits: 0,
                        },
                      )}
                    </FinancialValue>
                  }
                />
              </dl>
            ) : null}
          </Card>
        </section>
      ) : null}

      {isEmi ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-emi-panel"
        >
          <InboxSectionTitle>{t("emiHeading")}</InboxSectionTitle>
          <Text size="sm" tone="secondary">
            {t("emiHint")}
          </Text>
        </section>
      ) : null}

      {isEmergency ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-emergency-panel"
        >
          <StatusAlert
            variant="warning"
            title={t("emergencyHeading")}
            description={
              item.intentNote
                ? t("emergencyHintWithNote", { note: item.intentNote })
                : t("emergencyHint")
            }
          />
        </section>
      ) : null}

      {deferActions}
      {meta}
      {stickyBar}
    </div>
  );
}
