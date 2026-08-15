"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  ReviewItemType,
  type InboxAckAction,
  type InboxReceiptKind as InboxReceiptKindType,
} from "@/modules/inbox/application/inbox-constants";
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
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { LabeledSelect } from "@/shared/patterns/labeled-native-field";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  resolveInboxAction,
  dismissInboxAction,
  acknowledgeInboxAction,
} from "./actions";

type Props = {
  item: InboxReviewItem;
  jars: CaptureJarOption[];
};

type InboxErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type PendingAction = "resolve" | "dismiss" | "ack";

/**
 * Resolve / dismiss / acknowledge — partner-equal, offline fail-closed (ST-E06-002).
 */
export function InboxDecisionPanel({ item, jars }: Props) {
  const t = useTranslations("inbox");
  const tCatalog = useTranslations("catalog");
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

  const jarResolvable = isJarResolvableKind(item.kind);
  const isMaturity =
    item.kind === InboxItemKind.SAVINGS_MATURITY ||
    item.kind === InboxItemKind.SAVINGS_MATURED ||
    item.kind === InboxItemKind.RENEWAL_REQUIRED;
  const isEarlyWithdrawal =
    item.kind === InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION;
  const isEmi = item.kind === InboxItemKind.EMI_COMPLETE;
  const isEmergency = item.kind === InboxItemKind.EMERGENCY_DECLARATION;
  const isPaymentReminder = item.kind === InboxItemKind.PAYMENT_REMINDER;
  const maturityPayload =
    item.typed?.type === ReviewItemType.SAVINGS_MATURITY_DECISION
      ? item.typed.payload
      : null;
  const earlyPayload =
    item.typed?.type === ReviewItemType.EARLY_WITHDRAWAL_CONFIRMATION
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

  const showPatternSuggestion =
    jarResolvable &&
    item.suggestedJarId != null &&
    item.confidenceScore != null;
  const busy = pendingAction != null;

  const suggestedAction =
    maturityPayload?.suggestedAction ?? RenewalSuggestedAction.NONE;
  const highlightConfirm =
    suggestedAction === RenewalSuggestedAction.CONFIRM_CONFIGURED;
  const highlightWithdraw = suggestedAction === RenewalSuggestedAction.WITHDRAW;
  const equalWeight = suggestedAction === RenewalSuggestedAction.NONE;

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
      { status: "success" } | { status: "error"; code: ProductActionErrorCode }
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
      } catch {
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
    const moneyMoving =
      action === SavingsMaturityAckAction.WITHDRAW ||
      action === SavingsMaturityAckAction.CONFIRM_CONFIGURED ||
      action === SavingsMaturityAckAction.SWITCH ||
      action === SavingsMaturityAckAction.CHANGE_SETTLEMENT;
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

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="inbox-decision-panel"
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
          <Text size="sm" className="font-semibold text-text-primary">
            {t("resolveHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("activeJarOnlyHint")}
          </Text>
          <StatusAlert
            variant="info"
            title={t("resolveMoneySafeTitle")}
            description={t("resolveMoneySafeBody")}
          />

          {showPatternSuggestion ? (
            <StatusAlert
              variant="info"
              title={t("patternSuggestionTitle")}
              description={t("patternSuggestionBody", {
                confidence: Math.round((item.confidenceScore ?? 0) * 100),
                threshold: Math.round(AUTO_RESOLVE_CONFIDENCE_THRESHOLD * 100),
              })}
            />
          ) : null}

          {jars.length === 0 ? (
            <StatusAlert
              variant="warning"
              title={t("noJarsTitle")}
              description={t("noJarsBody")}
            />
          ) : (
            <label className="flex flex-col gap-(--space-2)">
              <Text size="sm" className="font-semibold text-text-primary">
                {t("jarLabel")}
              </Text>
              <select
                className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                value={jarId}
                onChange={(e) => setJarId(e.target.value)}
                aria-label={t("jarLabel")}
                data-testid="inbox-jar-select"
                disabled={busy}
              >
                {jars.map((jar) => (
                  <option key={jar.id} value={jar.id}>
                    {localizeCatalogName(tCatalog, "jars", jar.name)}
                    {jar.id === item.suggestedJarId
                      ? ` — ${t("suggestedSuffix")}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <BottomActionBar>
            <Button
              variant="primary"
              className="w-full"
              data-testid="inbox-resolve"
              isDisabled={busy || !online || jars.length === 0}
              onPress={onResolve}
            >
              {pendingAction === "resolve" ? t("resolving") : t("resolve")}
            </Button>
          </BottomActionBar>
        </section>
      ) : null}

      {isMaturity ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-maturity-panel"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("maturityHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("maturityHint")}
          </Text>
          <StatusAlert
            variant="info"
            title={t("maturitySourceTitle")}
            description={t("maturitySourceBody")}
          />
          {maturityPayload ? (
            <div className="flex flex-col gap-(--space-1) text-sm text-text-secondary">
              <span>
                {maturityPayload.providerName} ·{" "}
                {maturityPayload.currentPackage}
              </span>
              <span>
                {maturityPayload.currentRate}% · {t(policyLabelKey)}
              </span>
              {maturityPayload.recommendationReason
                ? (() => {
                    const label = reasonLabel(
                      maturityPayload.recommendationReason,
                    );
                    return label ? <span>{label}</span> : null;
                  })()
                : null}
            </div>
          ) : null}
          {maturityPayload?.warnings && maturityPayload.warnings.length > 0 ? (
            <StatusAlert
              variant="warning"
              title={t("maturityWarningsTitle")}
              description={maturityPayload.warnings
                .map((w) => t(`maturityWarnings.${w.code}`))
                .join(" · ")}
            />
          ) : null}
          {maturityPayload && maturityPayload.recommendedPackages.length > 0 ? (
            <LabeledSelect
              label={t("maturityPackageLabel")}
              value={selectedPackageId}
              options={maturityPayload.recommendedPackages.map((pkg) => {
                const reason = reasonLabel(pkg.reasonCode);
                return {
                  id: pkg.packageId,
                  label: `${pkg.packageName} · ${pkg.annualRate}% · ${pkg.durationDays}d${reason ? ` — ${reason}` : ""}`,
                };
              })}
              onChange={(event) => setSelectedPackageId(event.target.value)}
              disabled={busy}
              required
              data-testid="inbox-maturity-package"
            />
          ) : null}
          {maturityPayload ? (
            <LabeledSelect
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
              onChange={(event) =>
                setSelectedSettlementRule(event.target.value)
              }
              disabled={busy}
              required
              data-testid="inbox-maturity-settlement"
            />
          ) : null}
          {(
            [
              [
                SavingsMaturityAckAction.CONFIRM_CONFIGURED,
                "maturityConfirm",
                highlightConfirm || equalWeight ? "primary" : "secondary",
              ],
              [SavingsMaturityAckAction.SWITCH, "maturitySwitch", "secondary"],
              [
                SavingsMaturityAckAction.WITHDRAW,
                "maturityWithdraw",
                highlightWithdraw ? "primary" : "secondary",
              ],
              [
                SavingsMaturityAckAction.REMIND_TOMORROW,
                "maturityRemind",
                "secondary",
              ],
            ] as const
          ).map(([action, labelKey, variant]) => (
            <Button
              key={action}
              variant={variant}
              className="w-full"
              data-testid={`inbox-ack-${action}`}
              isDisabled={busy || !online}
              onPress={() => onSavingsMaturityAck(action)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </section>
      ) : null}

      {isEarlyWithdrawal ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-early-withdrawal-panel"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("earlyWithdrawalHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("earlyWithdrawalHint")}
          </Text>
          <StatusAlert
            variant="info"
            title={t("earlyWithdrawalSourceTitle")}
            description={t("earlyWithdrawalSourceBody")}
          />
          {earlyPayload ? (
            <div className="flex flex-col gap-(--space-1) text-sm text-text-secondary">
              <span>
                {t("earlyWithdrawalNet", {
                  amount: earlyPayload.netReturned,
                })}
              </span>
              <span>
                {t("earlyWithdrawalPenalty", {
                  amount: earlyPayload.penaltyAmount,
                })}
              </span>
            </div>
          ) : null}
          <Button
            variant="primary"
            className="w-full"
            data-testid="inbox-ack-confirm-early"
            isDisabled={busy || !online}
            onPress={() => onEarlyWithdrawAck(EarlyWithdrawalAckAction.CONFIRM)}
          >
            {t("earlyWithdrawalConfirm")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="inbox-ack-cancel-early"
            isDisabled={busy || !online}
            onPress={() => onEarlyWithdrawAck(EarlyWithdrawalAckAction.CANCEL)}
          >
            {t("earlyWithdrawalCancel")}
          </Button>
        </section>
      ) : null}

      {isEmi ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-emi-panel"
        >
          <Text size="sm" className="font-semibold text-text-primary">
            {t("emiHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("emiHint")}
          </Text>
          <Button
            variant="primary"
            className="w-full"
            data-testid="inbox-ack-celebrate"
            isDisabled={busy || !online}
            onPress={() => onAck(EmiAckAction.CELEBRATE)}
          >
            {t("emiCelebrate")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            data-testid="inbox-ack-later"
            isDisabled={busy || !online}
            onPress={() => onAck(EmiAckAction.LATER)}
          >
            {t("emiLater")}
          </Button>
        </section>
      ) : null}

      {isPaymentReminder ? (
        <section
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-payment-reminder-panel"
        >
          <StatusAlert
            variant="info"
            title={t("paymentReminderHeading")}
            description={
              item.expiresAt
                ? t("paymentReminderHintWithExpiry", {
                    expiresAt: item.expiresAt,
                  })
                : t("paymentReminderHint")
            }
          />
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

      {confirmDismiss ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="inbox-dismiss-confirm"
        >
          <StatusAlert
            variant="warning"
            title={t("dismissConfirmTitle")}
            description={t("dismissConfirmBody")}
          />
          <Button
            variant="primary"
            className="w-full"
            data-testid="inbox-dismiss-yes"
            isDisabled={busy || !online}
            onPress={onDismiss}
          >
            {pendingAction === "dismiss"
              ? t("dismissing")
              : t("dismissConfirmYes")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            isDisabled={busy}
            onPress={() => setConfirmDismiss(false)}
          >
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="w-full"
          data-testid="inbox-dismiss"
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
}
