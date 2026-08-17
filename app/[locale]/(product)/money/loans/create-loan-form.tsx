"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/shared/ui/form";
import {
  ControlledField,
  ControlledFields,
  type ControlledFieldConfig,
} from "@/shared/patterns/controlled-fields";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
} from "@/modules/tenancy/application/product-action-error";
import {
  addMonthsYmd,
  DEFAULT_CURRENCY,
  createLoanInputSchema,
  LOAN_INTEREST_STRATEGY_OPTIONS,
  LOAN_REPAYMENT_METHOD_OPTIONS,
  LOAN_TERM_UNIT_VALUES,
  LOAN_TYPE_OPTIONS,
  LoanInterestStrategy,
  LoanRepaymentMethod,
  LoanTermUnit,
  LoanType,
  simulateLoanPreview,
  type CreateLoanInput,
} from "@/modules/ledger/application/client";
import { createLoanAction } from "../money-products-actions";

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormValues = CreateLoanInput;

const DEFAULT_VALUES = {
  name: "",
  lender: "",
  loanType: LoanType.OTHER,
  principal: undefined,
  annualInterestRate: 0,
  interestStrategy: LoanInterestStrategy.FIXED,
  promoFixedRate: 0,
  promoFixedMonths: 12,
  promoFloatingRate: 0,
  promoRateEffectiveOn: null,
  repaymentMethod: LoanRepaymentMethod.FIXED_MONTHLY,
  termValue: 12,
  termUnit: LoanTermUnit.MONTHS,
  startDate: todayYmd(),
  firstPaymentDate: null,
  note: "",
} satisfies Partial<FormValues>;
const optionList = (
  values: readonly string[],
  label: (value: string) => string,
) => values.map((value) => ({ id: value, label: label(value) }));

export function CreateLoanForm() {
  const t = useTranslations("money.loansPage");
  const tErr = useTranslations("money.products.errors");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createLoanInputSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const interestStrategyValue = useWatch({
    control,
    name: "interestStrategy",
  });
  const firstPaymentDateValue = useWatch({
    control,
    name: "firstPaymentDate",
  });
  const startDate = useWatch({ control, name: "startDate" });
  const promoRateEffectiveOn = useWatch({
    control,
    name: "promoRateEffectiveOn",
  });
  const promoFixedMonths = useWatch({ control, name: "promoFixedMonths" });
  const principal = useWatch({ control, name: "principal" });
  const termValue = useWatch({ control, name: "termValue" });
  const annualInterestRate = useWatch({ control, name: "annualInterestRate" });
  const termUnit = useWatch({ control, name: "termUnit" });
  const repaymentMethod = useWatch({ control, name: "repaymentMethod" });
  const promoFixedRate = useWatch({ control, name: "promoFixedRate" });
  const promoFloatingRate = useWatch({ control, name: "promoFloatingRate" });
  const interestStrategy = interestStrategyValue ?? LoanInterestStrategy.FIXED;
  const firstPaymentDate = firstPaymentDateValue || startDate || todayYmd();
  const derivedPromoEffective =
    interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
      ? promoRateEffectiveOn && promoRateEffectiveOn >= firstPaymentDate
        ? promoRateEffectiveOn
        : addMonthsYmd(firstPaymentDate, Math.max(1, promoFixedMonths ?? 1))
      : null;
  const preview =
    principal != null && principal > 0 && (termValue ?? 0) > 0
      ? simulateLoanPreview({
          principal: Math.trunc(principal),
          annualInterestRate: annualInterestRate ?? 0,
          termValue: Math.trunc(termValue ?? 0),
          termUnit: termUnit ?? LoanTermUnit.MONTHS,
          firstPaymentDate,
          repaymentMethod: repaymentMethod ?? LoanRepaymentMethod.FIXED_MONTHLY,
          interestStrategy,
          promoFixedRate,
          promoFixedMonths,
          promoFloatingRate,
          promoRateEffectiveOn: derivedPromoEffective,
        })
      : null;
  const money = (amount: number) =>
    formatCurrency(amount, DEFAULT_CURRENCY, locale, {
      maximumFractionDigits: 0,
    });
  const error = (field: keyof FormValues) =>
    errors[field] ? tErr(PRODUCT_ACTION_ERROR_CODE.INVALID) : undefined;
  const selectOptions = {
    loanType: optionList(LOAN_TYPE_OPTIONS, (value) =>
      t(`loanTypes.${value}` as never),
    ),
    repaymentMethod: optionList(LOAN_REPAYMENT_METHOD_OPTIONS, (value) =>
      t(`repaymentMethods.${value}` as never),
    ),
    interestStrategy: optionList(LOAN_INTEREST_STRATEGY_OPTIONS, (value) =>
      t(`interestStrategies.${value}` as never),
    ),
    termUnit: optionList(LOAN_TERM_UNIT_VALUES, (value) =>
      t(`termUnits.${value}` as never),
    ),
  };
  const onSubmit = handleSubmit((submitted) => {
    statusAlert.hide();
    if (!online) {
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tErr(CLIENT_ACTION_ERROR_CODE.OFFLINE),
      });
      return;
    }
    if (!preview) {
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tErr(PRODUCT_ACTION_ERROR_CODE.INVALID),
      });
      return;
    }
    startTransition(async () => {
      const result = await createLoanAction({
        ...submitted,
        promoRateEffectiveOn: derivedPromoEffective,
      });
      if (result.status === "success") {
        reset(DEFAULT_VALUES);
        setOpen(false);
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: tErr(result.code),
      });
    });
  });
  if (!open)
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

  const commonFields = [
    {
      type: "select",
      name: "loanType",
      label: t("loanTypeLabel"),
      id: "loan-loanType",
      testId: "loan-type",
      options: selectOptions.loanType,
    },
    {
      type: "select",
      name: "repaymentMethod",
      label: t("repaymentMethodLabel"),
      id: "loan-repaymentMethod",
      testId: "loan-repayment-method",
      options: selectOptions.repaymentMethod,
    },
    {
      type: "select",
      name: "interestStrategy",
      label: t("interestStrategyLabel"),
      id: "loan-interestStrategy",
      testId: "loan-interest-strategy",
      options: selectOptions.interestStrategy,
    },
    {
      type: "number",
      name: "termValue",
      label: t("termValueLabel"),
      id: "loan-termValue",
      testId: "loan-term-value",
      minValue: 1,
      maxValue: 600,
      step: 1,
    },
    {
      type: "select",
      name: "termUnit",
      label: t("termUnitLabel"),
      id: "loan-termUnit",
      testId: "loan-term-unit",
      options: selectOptions.termUnit,
    },
    {
      type: "date",
      name: "startDate",
      label: t("startDateLabel"),
      id: "loan-startDate",
      testId: "loan-start-date",
    },
    {
      type: "date",
      name: "firstPaymentDate",
      label: t("firstPaymentDateLabel"),
      id: "loan-firstPaymentDate",
      testId: "loan-first-payment",
      emptyValue: null,
    },
  ] satisfies ControlledFieldConfig<FormValues>[];
  const promoFields =
    interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING
      ? ([
          {
            type: "number",
            name: "promoFixedRate",
            label: t("promoFixedRateLabel"),
            id: "loan-promoFixedRate",
            testId: "loan-promo-fixed-rate",
            minValue: 0,
            maxValue: 100,
            step: 0.01,
          },
          {
            type: "number",
            name: "promoFixedMonths",
            label: t("promoFixedMonthsLabel"),
            id: "loan-promoFixedMonths",
            testId: "loan-promo-fixed-months",
            minValue: 1,
            maxValue: 600,
            step: 1,
          },
          {
            type: "number",
            name: "promoFloatingRate",
            label: t("promoFloatingRateLabel"),
            id: "loan-promoFloatingRate",
            testId: "loan-promo-floating-rate",
            minValue: 0,
            maxValue: 100,
            step: 0.01,
          },
          {
            type: "date",
            name: "promoRateEffectiveOn",
            label: t("promoEffectiveOnLabel"),
            id: "loan-promoRateEffectiveOn",
            testId: "loan-promo-effective",
            emptyValue: null,
          },
        ] satisfies ControlledFieldConfig<FormValues>[])
      : [];

  return (
    <form
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="loan-add-form"
      onSubmit={onSubmit}
    >
      <TextField
        id="loan-name"
        label={t("nameLabel")}
        registration={register("name")}
        error={error("name")}
      />
      <TextField
        id="loan-lender"
        label={t("lenderLabel")}
        registration={register("lender")}
        error={error("lender")}
      />
      <ControlledFields
        control={control}
        fields={commonFields.slice(0, 1)}
        getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
      />
      <ControlledField
        control={control}
        field={{
          type: "amount",
          name: "principal",
          label: t("principalLabel"),
          id: "loan-principal",
          testId: "loan-principal",
        }}
        getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
      />
      <ControlledFields
        control={control}
        fields={commonFields.slice(1, 3)}
        getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
      />
      {interestStrategy === LoanInterestStrategy.PROMO_FIXED_TO_FLOATING ? (
        <>
          <ControlledFields
            control={control}
            fields={promoFields}
            getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
          />
          {derivedPromoEffective ? (
            <Text size="sm" tone="secondary">
              {t("promoEffectiveHint", { date: derivedPromoEffective })}
            </Text>
          ) : null}
        </>
      ) : (
        <ControlledField
          control={control}
          field={{
            type: "number",
            name: "annualInterestRate",
            label:
              interestStrategy === LoanInterestStrategy.FLOATING
                ? t("currentInterestLabel")
                : t("interestLabel"),
            id: "loan-interest",
            testId: "loan-interest",
            minValue: 0,
            maxValue: 100,
            step: 0.01,
          }}
          getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
        />
      )}
      <div className="grid grid-cols-2 gap-(--space-2)">
        <ControlledField
          control={control}
          field={commonFields[3]}
          getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
        />
        <ControlledField
          control={control}
          field={commonFields[4]}
          getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
        />
      </div>
      <ControlledFields
        control={control}
        fields={commonFields.slice(5)}
        getErrorMessage={() => tErr(PRODUCT_ACTION_ERROR_CODE.INVALID)}
      />
      <TextField
        id="loan-note"
        label={t("noteLabel")}
        registration={register("note")}
        error={error("note")}
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
              {t("simulationTotal", { amount: money(preview.totalRepayment) })}
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
          type="submit"
          variant="primary"
          className="min-h-11 flex-1"
          data-testid="loan-add-save"
          isDisabled={isPending || !online || !preview}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          isDisabled={isPending}
          onPress={() => {
            statusAlert.hide();
            reset(DEFAULT_VALUES);
            setOpen(false);
          }}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
