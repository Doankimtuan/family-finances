"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  moneySavingsPath,
  APP_PATH,
} from "@/modules/tenancy/application/app-path";
import {
  RenewalPolicy,
  SettlementRule,
  InterestCalcMethod,
  SavingType,
  RENEWAL_POLICY_VALUES,
  SETTLEMENT_RULE_VALUES,
} from "@/modules/savings/application/savings-constants";
import { computeFullTermInterest } from "@/modules/savings/application/savings-interest";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/client";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createSavingAction } from "../savings-actions";

type AccountOption = { id: string; name: string; type: string };
type ProviderOption = {
  id: string;
  displayName: string;
  savingType: string;
};
type PackageOption = {
  id: string;
  packageName: string;
  durationDays: number;
  annualInterestRate: number;
  minAmount: number | null;
  maxAmount: number | null;
};

type Props = {
  accounts: AccountOption[];
  providers: ProviderOption[];
  packagesByProvider: Record<string, PackageOption[]>;
};

const STEPS = ["funding", "provider", "product", "package", "review"] as const;

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

function needsRenewalConfig(policy: string): boolean {
  return (
    policy === RenewalPolicy.USE_SAVED_PREFERENCE ||
    policy === RenewalPolicy.AUTO_RENEW_UNTIL_CANCELLED ||
    policy === RenewalPolicy.ONE_TIME_RENEWAL
  );
}

function savingTypeLabel(
  t: ReturnType<typeof useTranslations<"money.savingsWizard">>,
  savingType: string,
): string {
  switch (savingType) {
    case SavingType.BANK_DEPOSIT:
      return t("savingTypes.bank_deposit");
    case SavingType.DIGITAL_SAVING:
      return t("savingTypes.digital_saving");
    case SavingType.FLEXIBLE_SAVING:
      return t("savingTypes.flexible_saving");
    case SavingType.MANUAL_SAVING:
      return t("savingTypes.manual_saving");
    default:
      return t("savingTypes.manual_saving");
  }
}

export function CreateSavingWizard({
  accounts,
  providers,
  packagesByProvider,
}: Props) {
  const t = useTranslations("money.savingsWizard");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [fundingAccountId, setFundingAccountId] = useState(
    accounts[0]?.id ?? "",
  );
  const [settlementAccountId, setSettlementAccountId] = useState(
    accounts[0]?.id ?? "",
  );
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const [packageId, setPackageId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [settlementRule, setSettlementRule] = useState<string>(
    SettlementRule.WITHDRAW_EVERYTHING,
  );
  const [renewalPolicy, setRenewalPolicy] = useState<string>(
    RenewalPolicy.ALWAYS_ASK,
  );
  const [preferredPackageId, setPreferredPackageId] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const packages = useMemo(
    () => packagesByProvider[providerId] ?? [],
    [packagesByProvider, providerId],
  );
  const selectedPackage = packages.find((p) => p.id === packageId) ?? null;
  const selectedProvider = providers.find((p) => p.id === providerId) ?? null;
  const fundingAccount =
    accounts.find((a) => a.id === fundingAccountId) ?? null;
  const settlementAccount =
    accounts.find((a) => a.id === settlementAccountId) ?? null;
  const showConfig = needsRenewalConfig(renewalPolicy);

  const principalAmount = Number(principal.replace(/\D/g, ""));
  const estimatedInterest = useMemo(() => {
    if (!selectedPackage) return 0;
    if (!Number.isFinite(principalAmount) || principalAmount <= 0) return 0;
    return computeFullTermInterest({
      principal: principalAmount,
      annualRate: selectedPackage.annualInterestRate,
      durationDays: selectedPackage.durationDays,
      method: InterestCalcMethod.SIMPLE,
    });
  }, [principalAmount, selectedPackage]);

  const money = (n: number) =>
    formatCurrency(n, DEFAULT_CURRENCY, locale, { maximumFractionDigits: 0 });

  const goNext = () => {
    if (step === "provider" && !packageId && packages[0]) {
      setPackageId(packages[0].id);
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="savings-create-wizard"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}

      <Text size="sm" tone="secondary">
        {step === "funding"
          ? t("stepFunding")
          : step === "provider"
            ? t("stepProvider")
            : step === "product"
              ? t("stepProduct")
              : step === "package"
                ? t("stepPackage")
                : t("stepReview")}
      </Text>

      {step === "funding" ? (
        <label className="flex flex-col gap-(--space-2)">
          <Text size="sm" className="font-semibold">
            {t("stepFunding")}
          </Text>
          <select
            className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
            value={fundingAccountId}
            onChange={(e) => {
              setFundingAccountId(e.target.value);
              if (!settlementAccountId) {
                setSettlementAccountId(e.target.value);
              }
            }}
            data-testid="savings-wizard-funding"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {step === "provider" ? (
        <div className="flex flex-col gap-(--space-2)">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`min-h-11 rounded-md border px-(--space-3) text-left text-sm ${
                providerId === p.id
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-surface"
              }`}
              data-testid={`savings-wizard-provider-${p.id}`}
              onClick={() => {
                setProviderId(p.id);
                setPackageId("");
                setPreferredPackageId("");
              }}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      ) : null}

      {step === "product" ? (
        <div className="rounded-md border border-border-subtle bg-surface p-(--space-4)">
          <Text size="sm" className="font-medium">
            {selectedProvider?.displayName}
          </Text>
          <Text size="sm" tone="secondary">
            {savingTypeLabel(t, selectedProvider?.savingType ?? "")}
          </Text>
        </div>
      ) : null}

      {step === "package" ? (
        <div className="flex flex-col gap-(--space-2)">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className={`min-h-11 rounded-md border px-(--space-3) text-left text-sm ${
                packageId === pkg.id
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-surface"
              }`}
              data-testid={`savings-wizard-package-${pkg.id}`}
              onClick={() => {
                setPackageId(pkg.id);
                if (!preferredPackageId) setPreferredPackageId(pkg.id);
              }}
            >
              <span className="font-medium">{pkg.packageName}</span>
              <span className="mt-1 block text-text-secondary">
                {t("packageMeta", {
                  rate: pkg.annualInterestRate,
                  days: pkg.durationDays,
                })}
              </span>
            </button>
          ))}
          <TextField
            id="savings-principal"
            label={t("principalLabel")}
            value={principal}
            inputMode="numeric"
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </div>
      ) : null}

      {step === "review" ? (
        <div className="flex flex-col gap-(--space-3)">
          <Text size="sm" tone="secondary">
            {t("reviewHint")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("receiptHint")}
          </Text>
          <ConfirmSummary
            data-testid="savings-wizard-preview"
            rows={[
              {
                id: "funding",
                label: t("stepFunding"),
                value: fundingAccount?.name ?? "",
              },
              {
                id: "provider",
                label: t("stepProvider"),
                value: selectedProvider?.displayName ?? "",
              },
              {
                id: "package",
                label: t("stepPackage"),
                value: selectedPackage?.packageName ?? "",
              },
              {
                id: "principal",
                label: t("principalLabel"),
                value: money(
                  Number.isFinite(principalAmount) ? principalAmount : 0,
                ),
              },
              {
                id: "expected",
                label: t("estimatedInterest"),
                value: t("estimatedInterestValue", {
                  amount: money(estimatedInterest),
                }),
              },
              {
                id: "settlement",
                label: t("settlementAccountLabel"),
                value: settlementAccount?.name ?? "",
              },
              {
                id: "rule",
                label: t("settlementRuleLabel"),
                value: t(
                  `settlementRules.${settlementRule}` as
                    | "settlementRules.roll_principal_interest"
                    | "settlementRules.roll_principal_only"
                    | "settlementRules.withdraw_everything",
                ),
              },
              {
                id: "renewal",
                label: t("renewalPolicyLabel"),
                value: t(
                  `renewalPolicies.${renewalPolicy}` as
                    | "renewalPolicies.always_ask"
                    | "renewalPolicies.use_saved_preference"
                    | "renewalPolicies.auto_renew_until_cancelled"
                    | "renewalPolicies.one_time_renewal",
                ),
              },
            ]}
          />
          <label className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold">
              {t("settlementAccountLabel")}
            </Text>
            <select
              className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
              value={settlementAccountId}
              onChange={(e) => setSettlementAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold">
              {t("settlementRuleLabel")}
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
          <label className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold">
              {t("renewalPolicyLabel")}
            </Text>
            <select
              className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
              value={renewalPolicy}
              onChange={(e) => setRenewalPolicy(e.target.value)}
              data-testid="savings-wizard-renewal-policy"
            >
              {RENEWAL_POLICY_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(`renewalPolicies.${value}`)}
                </option>
              ))}
            </select>
          </label>
          {showConfig ? (
            <label className="flex flex-col gap-(--space-2)">
              <Text size="sm" className="font-semibold">
                {t("preferredPackageLabel")}
              </Text>
              <select
                className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm"
                value={preferredPackageId || packageId}
                onChange={(e) => setPreferredPackageId(e.target.value)}
                data-testid="savings-wizard-preferred-package"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      <BottomActionBar>
        {step !== "review" ? (
          <Button
            variant="primary"
            className="min-h-11 w-full"
            data-testid="savings-wizard-next"
            isDisabled={
              (step === "funding" && !fundingAccountId) ||
              (step === "provider" && !providerId) ||
              (step === "package" && (!packageId || !principal))
            }
            onPress={goNext}
          >
            {t("next")}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="min-h-11 w-full"
            data-testid="savings-wizard-confirm"
            isDisabled={isPending || !online}
            onPress={() => {
              if (!online) {
                setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
                return;
              }
              startTransition(async () => {
                const result = await createSavingAction({
                  fundingAccountId,
                  settlementAccountId,
                  providerId,
                  packageId,
                  principal: Number(principal.replace(/\D/g, "")),
                  renewalPolicy:
                    renewalPolicy as (typeof RENEWAL_POLICY_VALUES)[number],
                  settlementRule:
                    settlementRule as (typeof SETTLEMENT_RULE_VALUES)[number],
                  renewalConfig: showConfig
                    ? {
                        preferredPackageId: preferredPackageId || packageId,
                        preferredSettlementRule:
                          settlementRule as (typeof SETTLEMENT_RULE_VALUES)[number],
                        preferredSettlementAccountId: settlementAccountId,
                      }
                    : undefined,
                });
                if (result.status === "success" && result.id) {
                  router.replace(moneySavingsPath(result.id));
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
            {isPending ? t("confirming") : t("confirm")}
          </Button>
        )}
        {stepIndex > 0 ? (
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            onPress={goBack}
          >
            {t("back")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            onPress={() => router.push(APP_PATH.MONEY_SAVINGS)}
          >
            {t("back")}
          </Button>
        )}
      </BottomActionBar>
    </div>
  );
}
