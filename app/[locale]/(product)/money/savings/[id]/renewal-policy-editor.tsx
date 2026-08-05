"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  RenewalPolicy,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
  type RenewalPolicy as RenewalPolicyType,
  type SettlementRule as SettlementRuleType,
} from "@/modules/savings/application/savings-constants";
import type { RenewalConfig } from "@/modules/savings/application/savings-types";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { updateRenewalPolicyAction } from "../savings-actions";

type PackageOption = { id: string; packageName: string };

type Props = {
  savingId: string;
  renewalPolicy: RenewalPolicyType;
  renewalConfig: RenewalConfig;
  packages: PackageOption[];
};

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

function needsConfig(policy: string): boolean {
  return (
    policy === RenewalPolicy.USE_SAVED_PREFERENCE ||
    policy === RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED ||
    policy === RenewalPolicy.ONE_TIME_RENEWAL
  );
}

/** Edit renewal policy on an active saving (recommendation only). */
export function RenewalPolicyEditor({
  savingId,
  renewalPolicy: initialPolicy,
  renewalConfig: initialConfig,
  packages,
}: Props) {
  const t = useTranslations("money.savingsDetail");
  const tErr = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [policy, setPolicy] = useState<string>(initialPolicy);
  const [settlementRule, setSettlementRule] = useState<string>(
    initialConfig.preferredSettlementRule,
  );
  const [preferredPackageId, setPreferredPackageId] = useState(
    initialConfig.preferredPackageId ?? packages[0]?.id ?? "",
  );
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="savings-renewal-policy-editor"
    >
      <Text size="sm" className="font-semibold text-text-primary">
        {t("renewalPolicyTitle")}
      </Text>
      <Text size="sm" tone="secondary">
        {t("renewalPolicyHint")}
      </Text>
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <label className="flex flex-col gap-(--space-2)">
        <Text size="sm" className="font-semibold">
          {t("renewalPolicyLabel")}
        </Text>
        <select
          className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          data-testid="savings-detail-renewal-policy"
        >
          {RENEWAL_POLICY_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`renewalPolicies.${value}`)}
            </option>
          ))}
        </select>
      </label>
      {needsConfig(policy) ? (
        <>
          <label className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold">
              {t("preferredSettlementRuleLabel")}
            </Text>
            <select
              className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
              value={settlementRule}
              onChange={(e) => setSettlementRule(e.target.value)}
            >
              {SETTLEMENT_RULE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`settlementRules.${value}`)}
                </option>
              ))}
            </select>
          </label>
          {packages.length > 0 ? (
            <label className="flex flex-col gap-(--space-2)">
              <Text size="sm" className="font-semibold">
                {t("preferredPackageLabel")}
              </Text>
              <select
                className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
                value={preferredPackageId}
                onChange={(e) => setPreferredPackageId(e.target.value)}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="savings-detail-save-policy"
        isDisabled={isPending || !online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          startTransition(async () => {
            const result = await updateRenewalPolicyAction({
              savingId,
              renewalPolicy: policy as RenewalPolicyType,
              renewalConfig: needsConfig(policy)
                ? {
                    preferredPackageId: preferredPackageId || null,
                    preferredSettlementRule:
                      settlementRule as SettlementRuleType,
                    preferredSettlementAccountId:
                      initialConfig.preferredSettlementAccountId,
                  }
                : undefined,
            });
            if (result.status === "success") {
              router.refresh();
              return;
            }
            setErrorCode(
              result.status === "error"
                ? result.code
                : CLIENT_ACTION_ERROR_CODE.OFFLINE,
            );
          });
        }}
      >
        {isPending ? t("savingPolicy") : t("savePolicy")}
      </Button>
    </section>
  );
}
