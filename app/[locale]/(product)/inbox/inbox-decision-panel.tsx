"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type { CaptureJarOption } from "@/modules/ledger/application/client";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import {
  InboxItemKind,
  MaturityAckAction,
  EmiAckAction,
  isJarResolvableKind,
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  type InboxAckAction,
} from "@/modules/inbox/application/inbox-constants";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
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
  const isMaturity = item.kind === InboxItemKind.SAVINGS_MATURITY;
  const isEmi = item.kind === InboxItemKind.EMI_COMPLETE;
  const isEmergency = item.kind === InboxItemKind.EMERGENCY_DECLARATION;
  const isPaymentReminder = item.kind === InboxItemKind.PAYMENT_REMINDER;
  const showPatternSuggestion =
    jarResolvable &&
    item.suggestedJarId != null &&
    item.confidenceScore != null;
  const busy = pendingAction != null;

  const run = (
    action: PendingAction,
    fn: () => Promise<
      { status: "success" } | { status: "error"; code: ProductActionErrorCode }
    >,
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
          // Replace only — avoid push+refresh loops that leave the UI hanging.
          router.replace(APP_PATH.INBOX);
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
    run("resolve", () => resolveInboxAction({ inboxItemId: item.id, jarId }));
  };

  const onDismiss = () => {
    run("dismiss", () => dismissInboxAction({ inboxItemId: item.id }));
  };

  const onAck = (action: InboxAckAction) => {
    run("ack", () => acknowledgeInboxAction({ inboxItemId: item.id, action }));
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

          <Button
            variant="primary"
            className="w-full"
            data-testid="inbox-resolve"
            isDisabled={busy || !online || jars.length === 0}
            onPress={onResolve}
          >
            {pendingAction === "resolve" ? t("resolving") : t("resolve")}
          </Button>
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
          {(
            [
              [MaturityAckAction.RENEW, "maturityRenew"],
              [MaturityAckAction.SWITCH, "maturitySwitch"],
              [MaturityAckAction.WITHDRAW, "maturityWithdraw"],
            ] as const
          ).map(([action, labelKey]) => (
            <Button
              key={action}
              variant={
                action === MaturityAckAction.RENEW ? "primary" : "secondary"
              }
              className="w-full"
              data-testid={`inbox-ack-${action}`}
              isDisabled={busy || !online}
              onPress={() => onAck(action)}
            >
              {t(labelKey)}
            </Button>
          ))}
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
