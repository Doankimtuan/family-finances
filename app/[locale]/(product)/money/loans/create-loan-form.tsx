"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { AmountField } from "@/shared/patterns/amount-field";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  addMonthsYmd,
  DEFAULT_CURRENCY,
  LOAN_INTEREST_STRATEGY_OPTIONS,
  LOAN_REPAYMENT_METHOD_OPTIONS,
  LOAN_TERM_UNIT_VALUES,
  LOAN_TYPE_OPTIONS,
  LoanInterestStrategy,
  LoanRepaymentMethod,
  LoanTermUnit,
  LoanType,
  simulateLoanPreview,
} from "@/modules/ledger/application/client";
import { createLoanAction } from "../money-products-actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateLoanForm() {
  const t = useTranslations("money.loansPage");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lender, setLender] = useState("");
  const [loanType, setLoanType] = useState<string>(LoanType.OTHER);
  const [principal, setPrincipal] = useState<number | null>(null);
  const [interest, setInterest] = useState(0);
  const [interestStrategy, setInterestStrategy] = useState<string>(
    LoanInterestStrategy.FIXED,
  );
  const [promoFixedRate, setPromoFixedRate] = useState(0);
  const [promoFixedMonths, setPromoFixedMonths] = useState(12);
  const [promoFloatingRate, setPromoFloatingRate] = useState(0);
  const [promoEffectiveOn, setPromoEffectiveOn] = useState("");
  const [repaymentMethod, setRepaymentMethod] = useState<string>(
    LoanRepaymentMethod.FIXED_MONTHLY,
  );
  const [termValue, setTermValue] = useState(12);
  const [termUnit, setTermUnit] = useState<string>(LoanTermUnit.MONTHS);
  const [startDate, setStartDate] = useState(todayYmd);
  const [firstPaymentDate, setFirstPaymentDate] = useState("");
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const principalAmt = principal ?? 0;
  const firstPay = firstPaymentDate || startDate || todayYmd();
  const derivedPromoEffective =
    interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
      ? promoEffectiveOn && promoEffectiveOn >= firstPay
        ? promoEffectiveOn
        : addMonthsYmd(firstPay, Math.max(1, promoFixedMonths))
      : null;

  const preview =
    principal != null &&
    principalAmt > 0 &&
    termValue > 0 &&
    (interestStrategy !== LoanInterestStrategy.PROMO_FIXED_TO_FLOATING ||
      promoFixedMonths > 0)
      ? simulateLoanPreview({
          principal: Math.trunc(principalAmt),
          annualInterestRate: interest,
          termValue: Math.trunc(termValue),
          termUnit: termUnit as (typeof LOAN_TERM_UNIT_VALUES)[number],
          firstPaymentDate: firstPay,
          repaymentMethod:
            repaymentMethod as (typeof LOAN_REPAYMENT_METHOD_OPTIONS)[number],
          interestStrategy:
            interestStrategy as (typeof LOAN_INTEREST_STRATEGY_OPTIONS)[number],
          promoFixedRate,
          promoFixedMonths,
          promoFloatingRate,
          promoRateEffectiveOn: derivedPromoEffective,
        })
      : null;

  const money = (n: number) =>
    formatCurrency(n, DEFAULT_CURRENCY, locale, { maximumFractionDigits: 0 });

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-add-open"
        isDisabled={!online}
        onPress={() => setOpen(true)}
      >
        {online ? t("add") : tErr("offline")}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="loan-add-form"
    >
      {errorCode ? (
        <StatusAlert variant="danger" title={tErr(errorCode)} />
      ) : null}
      <TextField
        id="loan-name"
        label={t("nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        id="loan-lender"
        label={t("lenderLabel")}
        value={lender}
        onChange={(e) => setLender(e.target.value)}
      />
      <label className="flex flex-col gap-(--space-1)">
        <span className="text-sm text-text-secondary">
          {t("loanTypeLabel")}
        </span>
        <select
          className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={loanType}
          onChange={(e) => setLoanType(e.target.value)}
          data-testid="loan-type"
        >
          {LOAN_TYPE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`loanTypes.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <AmountField
        id="loan-principal"
        label={t("principalLabel")}
        value={principal}
        onValueChange={setPrincipal}
        data-testid="loan-principal"
      />
      <label className="flex flex-col gap-(--space-1)">
        <span className="text-sm text-text-secondary">
          {t("repaymentMethodLabel")}
        </span>
        <select
          className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={repaymentMethod}
          onChange={(e) => setRepaymentMethod(e.target.value)}
          data-testid="loan-repayment-method"
        >
          {LOAN_REPAYMENT_METHOD_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`repaymentMethods.${value}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-(--space-1)">
        <span className="text-sm text-text-secondary">
          {t("interestStrategyLabel")}
        </span>
        <select
          className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
          value={interestStrategy}
          onChange={(e) => setInterestStrategy(e.target.value)}
          data-testid="loan-interest-strategy"
        >
          {LOAN_INTEREST_STRATEGY_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {t(`interestStrategies.${value}`)}
            </option>
          ))}
        </select>
      </label>
      {interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING ? (
        <>
          <TextField
            id="loan-promo-fixed-rate"
            label={t("promoFixedRateLabel")}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            value={String(promoFixedRate)}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPromoFixedRate(Number.isFinite(next) ? next : 0);
            }}
            data-testid="loan-promo-fixed-rate"
          />
          <TextField
            id="loan-promo-fixed-months"
            label={t("promoFixedMonthsLabel")}
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            step={1}
            value={String(promoFixedMonths)}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) setPromoFixedMonths(Math.trunc(next));
            }}
            data-testid="loan-promo-fixed-months"
          />
          <TextField
            id="loan-promo-floating-rate"
            label={t("promoFloatingRateLabel")}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            value={String(promoFloatingRate)}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPromoFloatingRate(Number.isFinite(next) ? next : 0);
            }}
            data-testid="loan-promo-floating-rate"
          />
          <TextField
            id="loan-promo-effective"
            label={t("promoEffectiveOnLabel")}
            type="date"
            value={promoEffectiveOn}
            onChange={(e) => setPromoEffectiveOn(e.target.value)}
            data-testid="loan-promo-effective"
          />
          {derivedPromoEffective ? (
            <Text size="sm" tone="secondary">
              {t("promoEffectiveHint", { date: derivedPromoEffective })}
            </Text>
          ) : null}
        </>
      ) : (
        <TextField
          id="loan-interest"
          label={
            interestStrategy === LoanInterestStrategy.FLOATING
              ? t("currentInterestLabel")
              : t("interestLabel")
          }
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.01"
          value={String(interest)}
          onChange={(e) => {
            const next = Number(e.target.value);
            setInterest(Number.isFinite(next) ? next : 0);
          }}
          data-testid="loan-interest"
        />
      )}
      <div className="grid grid-cols-2 gap-(--space-2)">
        <TextField
          id="loan-term-value"
          label={t("termValueLabel")}
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          step={1}
          value={String(termValue)}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next)) setTermValue(Math.trunc(next));
          }}
          data-testid="loan-term-value"
        />
        <label className="flex flex-col gap-(--space-1)">
          <span className="text-sm text-text-secondary">
            {t("termUnitLabel")}
          </span>
          <select
            className="min-h-11 rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
            value={termUnit}
            onChange={(e) => setTermUnit(e.target.value)}
            data-testid="loan-term-unit"
          >
            {LOAN_TERM_UNIT_VALUES.map((value) => (
              <option key={value} value={value}>
                {t(`termUnits.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextField
        id="loan-start-date"
        label={t("startDateLabel")}
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        data-testid="loan-start-date"
      />
      <TextField
        id="loan-first-payment"
        label={t("firstPaymentDateLabel")}
        type="date"
        value={firstPaymentDate}
        onChange={(e) => setFirstPaymentDate(e.target.value)}
        data-testid="loan-first-payment"
      />
      <TextField
        id="loan-note"
        label={t("noteLabel")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div
        className="flex flex-col gap-(--space-2) rounded-md border border-border-subtle bg-surface p-(--space-3)"
        data-testid="loan-simulation"
      >
        <Text size="sm" className="font-medium">
          {t("simulationTitle")}
        </Text>
        {preview ? (
          <>
            <Text size="sm" tone="secondary" data-testid="loan-sim-monthly">
              {t("simulationMonthly", {
                amount: money(preview.monthlyPayment),
              })}
            </Text>
            {preview.changeAfterMonths != null ? (
              <>
                <Text size="sm" tone="secondary" data-testid="loan-sim-promo">
                  {t("simulationPromoChange", {
                    months: preview.changeAfterMonths,
                  })}
                </Text>
                <Text
                  size="sm"
                  tone="secondary"
                  data-testid="loan-sim-monthly-after"
                >
                  {t("simulationMonthlyAfter", {
                    amount: money(preview.monthlyPaymentAfterChange ?? 0),
                  })}
                </Text>
              </>
            ) : null}
            <Text size="sm" tone="secondary" data-testid="loan-sim-interest">
              {t("simulationInterest", {
                amount: money(preview.totalInterest),
              })}
            </Text>
            <Text size="sm" tone="secondary" data-testid="loan-sim-total">
              {t("simulationTotal", {
                amount: money(preview.totalRepayment),
              })}
            </Text>
            <Text size="sm" tone="secondary">
              {t("simulationEndDate", { date: preview.endDate })}
            </Text>
          </>
        ) : (
          <Text size="sm" tone="secondary">
            {t("simulationHint")}
          </Text>
        )}
      </div>

      <div className="flex gap-(--space-2)">
        <Button
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-add-save"
          isDisabled={isPending || !online || !preview}
          onPress={() => {
            setErrorCode(null);
            if (!online) {
              setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
              return;
            }
            if (!preview) {
              setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
              return;
            }
            startTransition(async () => {
              const result = await createLoanAction({
                name,
                lender: lender.trim() || undefined,
                loanType: loanType as (typeof LOAN_TYPE_OPTIONS)[number],
                principal: Math.trunc(principalAmt),
                annualInterestRate: interest,
                interestStrategy:
                  interestStrategy as (typeof LOAN_INTEREST_STRATEGY_OPTIONS)[number],
                promoFixedRate:
                  interestStrategy ===
                  LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
                    ? promoFixedRate
                    : undefined,
                promoFixedMonths:
                  interestStrategy ===
                  LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
                    ? promoFixedMonths
                    : undefined,
                promoFloatingRate:
                  interestStrategy ===
                  LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
                    ? promoFloatingRate
                    : undefined,
                promoRateEffectiveOn: derivedPromoEffective,
                repaymentMethod:
                  repaymentMethod as (typeof LOAN_REPAYMENT_METHOD_OPTIONS)[number],
                termValue: Math.trunc(termValue),
                termUnit: termUnit as (typeof LOAN_TERM_UNIT_VALUES)[number],
                startDate,
                firstPaymentDate: firstPaymentDate || undefined,
                note: note.trim() || undefined,
              });
              if (result.status === "success") {
                setOpen(false);
                router.refresh();
                return;
              }
              setErrorCode(result.code);
            });
          }}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
