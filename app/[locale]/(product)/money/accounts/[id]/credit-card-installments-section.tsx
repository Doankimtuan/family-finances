"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  buildCreditCardInstallmentPreview,
  buildCreditCardInstallmentViewModel,
  percentageToBasisPoints,
  type CreditCardInstallment,
} from "@/modules/ledger/application/client";
import {
  CARD_INSTALLMENT_TERM_PRESETS,
  CreditCardInstallmentCalculationSource,
  CreditCardInstallmentFeeTiming,
  CreditCardInstallmentFeeType,
  CreditCardInstallmentOrigin,
  CreditCardInstallmentProgram,
  CreditCardInstallmentStatus,
  type CreditCardInstallmentFeeType as CreditCardInstallmentFeeTypeValue,
  type CreditCardInstallmentProgram as CreditCardInstallmentProgramValue,
} from "@/modules/ledger/application/ledger-constants";
import { ProductActionStatus } from "@/modules/tenancy/application/product-action-error";
import { formatCurrency } from "@/shared/i18n/formatters";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AmountField } from "@/shared/patterns/amount-field";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { LabeledSelect } from "@/shared/patterns/labeled-native-field";
import { SectionHeader } from "@/shared/patterns/section-header";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { DatePickerField, NumberField, TextField } from "@/shared/ui/form";
import { Progress } from "@/shared/ui/progress";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { todayIsoDate } from "@/shared/utils/iso-date";
import { ACCOUNT_DETAIL_PREVIEW_CONFIG } from "./detail-constants";
import {
  registerCreditCardInstallmentAction,
  stopCreditCardInstallmentTrackingAction,
} from "../actions";

type EligiblePurchase = {
  id: string;
  description: string | null;
  amount: number;
  transactionDate: string;
  categoryId: string | null;
  status: string;
};

type Props = {
  cardAccountId: string;
  installments: CreditCardInstallment[];
  eligiblePurchases: EligiblePurchase[];
  currency: string;
};

export function CreditCardInstallmentsSection({
  cardAccountId,
  installments,
  eligiblePurchases,
  currency,
}: Props) {
  const t = useTranslations("money.creditCard");
  const locale = useLocale();
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<EligiblePurchase | null>(null);
  const [program, setProgram] = useState<CreditCardInstallmentProgramValue>(
    CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
  );
  const [termCount, setTermCount] = useState<number>(
    CARD_INSTALLMENT_TERM_PRESETS[0],
  );
  const [firstExpectedDate, setFirstExpectedDate] = useState(todayIsoDate);
  const [feeType, setFeeType] = useState<CreditCardInstallmentFeeTypeValue>(
    CreditCardInstallmentFeeType.NONE,
  );
  const [feeAmount, setFeeAmount] = useState<number | null>(null);
  const [feePercent, setFeePercent] = useState(0);
  const [feeTiming, setFeeTiming] = useState(
    CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
  );
  const [interestPercent, setInterestPercent] = useState(0);
  const [quotedTotal, setQuotedTotal] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const [trackingToStop, setTrackingToStop] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatMoney = (amount: number) =>
    formatCurrency(amount, currency, locale, { maximumFractionDigits: 0 });
  const isFeeProgram =
    program ===
      CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE ||
    program === CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE;
  const isInterestProgram =
    program ===
      CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE ||
    program === CreditCardInstallmentProgram.FLAT_INTEREST_WITH_CONVERSION_FEE;
  const isQuotedProgram = program === CreditCardInstallmentProgram.BANK_QUOTED;

  const preview = useMemo(
    () =>
      selected
        ? buildCreditCardInstallmentPreview({
            principal: selected.amount,
            termCount,
            firstExpectedDate,
            program,
            calculationSource: isQuotedProgram
              ? CreditCardInstallmentCalculationSource.BANK_QUOTED
              : CreditCardInstallmentCalculationSource.DERIVED,
            conversionFeeType: isFeeProgram
              ? feeType
              : CreditCardInstallmentFeeType.NONE,
            conversionFeeFixedAmount: feeAmount,
            conversionFeeRateBps: percentageToBasisPoints(feePercent),
            feeTiming,
            flatInterestRateBps: percentageToBasisPoints(interestPercent),
            quotedTotalRepayment: quotedTotal,
          })
        : null,
    [
      selected,
      termCount,
      firstExpectedDate,
      program,
      isQuotedProgram,
      isFeeProgram,
      feeType,
      feeAmount,
      feePercent,
      feeTiming,
      interestPercent,
      quotedTotal,
    ],
  );

  const reset = () => {
    setSelected(null);
    setProgram(CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE);
    setTermCount(CARD_INSTALLMENT_TERM_PRESETS[0]);
    setFirstExpectedDate(todayIsoDate());
    setFeeType(CreditCardInstallmentFeeType.NONE);
    setFeeAmount(null);
    setFeePercent(0);
    setFeeTiming(CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD);
    setInterestPercent(0);
    setQuotedTotal(null);
    setNote("");
    setError(false);
  };

  const save = () => {
    if (!selected || !preview || !online) {
      setError(true);
      return;
    }
    setError(false);
    startTransition(async () => {
      const result = await registerCreditCardInstallmentAction({
        cardAccountId,
        sourceTransactionId: selected.id,
        origin: CreditCardInstallmentOrigin.POST_PURCHASE,
        termCount,
        firstExpectedDate,
        program,
        calculationSource: isQuotedProgram
          ? CreditCardInstallmentCalculationSource.BANK_QUOTED
          : CreditCardInstallmentCalculationSource.DERIVED,
        conversionFeeType: isFeeProgram
          ? feeType
          : CreditCardInstallmentFeeType.NONE,
        conversionFeeFixedAmount: feeAmount ?? undefined,
        conversionFeeRateBps: percentageToBasisPoints(feePercent) || undefined,
        feeTiming,
        flatInterestRateBps:
          percentageToBasisPoints(interestPercent) || undefined,
        quotedTotalRepayment: quotedTotal ?? undefined,
        note: note.trim() || null,
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        reset();
        setIsOpen(false);
        router.refresh();
        return;
      }
      setError(true);
    });
  };

  const requestStopTracking = (installmentId: string) => {
    setError(false);
    setTrackingToStop(installmentId);
  };

  const closeStopTracking = () => {
    if (isPending) return;
    setError(false);
    setTrackingToStop(null);
  };

  const stopTracking = () => {
    if (!trackingToStop) return;
    setError(false);
    startTransition(async () => {
      const result = await stopCreditCardInstallmentTrackingAction({
        installmentId: trackingToStop,
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        setTrackingToStop(null);
        router.refresh();
        return;
      }
      setError(true);
    });
  };

  const viewModels = installments
    .filter(
      (installment) =>
        installment.status !== CreditCardInstallmentStatus.STOPPED,
    )
    .map(buildCreditCardInstallmentViewModel)
    .slice(0, ACCOUNT_DETAIL_PREVIEW_CONFIG.INSTALLMENT_LIMIT);
  const programOptions = [
    {
      id: CreditCardInstallmentProgram.ZERO_INTEREST_ZERO_FEE,
      label: t("programZeroFee"),
    },
    {
      id: CreditCardInstallmentProgram.ZERO_INTEREST_WITH_CONVERSION_FEE,
      label: t("programZeroWithFee"),
    },
    {
      id: CreditCardInstallmentProgram.FLAT_INTEREST_WITHOUT_CONVERSION_FEE,
      label: t("programInterest"),
    },
    { id: CreditCardInstallmentProgram.BANK_QUOTED, label: t("programQuoted") },
  ];

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="card-installments"
    >
      <div className="flex items-center justify-between gap-(--space-3)">
        <SectionHeader title={t("emiTitle")} />
        <Button
          variant="secondary"
          size="sm"
          isDisabled={!online || isPending || eligiblePurchases.length === 0}
          onPress={() => {
            setError(false);
            setIsOpen(true);
          }}
          data-testid="card-installment-open"
        >
          {t("convertTitle")}
        </Button>
      </div>
      {viewModels.length === 0 ? (
        <Text size="sm" tone="secondary">
          {t("emiEmpty")}
        </Text>
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {viewModels.map((viewModel) => {
            const { installment } = viewModel;
            return (
              <li
                key={installment.id}
                className="flex flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle/70 bg-surface-muted px-(--space-3) py-(--space-3)"
                data-testid={`card-installment-${installment.id}`}
              >
                <div className="flex items-start justify-between gap-(--space-3)">
                  <div className="min-w-0">
                    <Text size="sm" weight="medium">
                      {installment.description ?? t("convertItemFallback")}
                    </Text>
                  </div>
                  <div className="shrink-0 text-right">
                    <Text size="xs" tone="secondary">
                      {t("installmentRemainingLabel")}
                    </Text>
                    <Text size="sm" className="tabular-nums font-medium">
                      <FinancialValue>
                        {formatMoney(viewModel.remainingAmount)}
                      </FinancialValue>
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-(--space-3)">
                  <Progress
                    value={viewModel.progressPercent}
                    label={t("installmentProgressLabel", {
                      percent: viewModel.progressPercent,
                    })}
                    showLabel={false}
                    className="min-w-0 flex-1"
                  />
                  <Text size="xs" tone="secondary" className="shrink-0">
                    {t("installmentProgress", {
                      current: viewModel.currentTerm,
                      total: installment.termCount,
                      percent: viewModel.progressPercent,
                    })}
                  </Text>
                </div>
                {viewModel.nextExpected ? (
                  <div className="flex items-end justify-between gap-(--space-3) border-t border-border-subtle/70 pt-(--space-2)">
                    <div>
                      <Text size="xs" tone="secondary">
                        {t("installmentNextLabel")}
                      </Text>
                      <Text size="sm" weight="medium" className="tabular-nums">
                        <FinancialValue>
                          {formatMoney(viewModel.nextExpected.totalAmount)}
                        </FinancialValue>
                      </Text>
                    </div>
                    <Text
                      size="sm"
                      tone="secondary"
                      className="shrink-0 text-right tabular-nums"
                    >
                      {viewModel.nextExpected.expectedDate}
                    </Text>
                  </div>
                ) : null}
                <Text size="xs" tone="secondary">
                  {t("totalExtraCost")}:{" "}
                  <FinancialValue>
                    {formatMoney(viewModel.totalExtraCost)}
                  </FinancialValue>
                </Text>
                {installment.status === CreditCardInstallmentStatus.ACTIVE ? (
                  <div className="flex flex-col gap-(--space-2)">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start px-(--space-2) text-danger"
                      isDisabled={isPending || !online}
                      onPress={() => requestStopTracking(installment.id)}
                    >
                      {t("stopTracking")}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <Sheet
        isOpen={isOpen}
        onOpenChange={(next) => {
          if (!next) {
            reset();
            setIsOpen(false);
          }
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("convertTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-4)">
              <Text size="sm" tone="secondary">
                {t("trackingHint")}
              </Text>
              {!selected ? (
                <div className="flex flex-col gap-(--space-2)">
                  <SectionHeader title={t("eligibleTitle")} />
                  {eligiblePurchases.length === 0 ? (
                    <Text size="sm" tone="secondary">
                      {t("eligibleEmpty")}
                    </Text>
                  ) : (
                    <ul className="flex flex-col gap-(--space-2)">
                      {eligiblePurchases.map((purchase) => (
                        <li key={purchase.id}>
                          <Button
                            variant="secondary"
                            className="h-auto w-full justify-start px-(--space-3) py-(--space-3) text-left"
                            onPress={() => setSelected(purchase)}
                          >
                            <span className="flex w-full flex-col gap-1">
                              <span className="flex justify-between gap-(--space-2)">
                                <span className="truncate">
                                  {purchase.description ??
                                    t("convertItemFallback")}
                                </span>
                                <span className="shrink-0 tabular-nums">
                                  <FinancialValue>
                                    {formatMoney(purchase.amount)}
                                  </FinancialValue>
                                </span>
                              </span>
                              <span className="text-xs text-text-secondary">
                                {purchase.transactionDate}
                              </span>
                            </span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-(--space-3) border-y border-border-subtle/70 py-(--space-2)">
                    <div>
                      <Text size="sm" tone="secondary">
                        {t("selectedPurchase")}
                      </Text>
                      <Text size="sm" weight="medium">
                        {selected.description ?? t("convertItemFallback")}
                      </Text>
                      <Text size="sm" tone="secondary">
                        {selected.transactionDate}
                      </Text>
                    </div>
                    <Text size="sm" className="tabular-nums font-medium">
                      <FinancialValue>
                        {formatMoney(selected.amount)}
                      </FinancialValue>
                    </Text>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => setSelected(null)}
                  >
                    {t("eligibleTitle")}
                  </Button>
                  <LabeledSelect
                    label={t("programLabel")}
                    value={program}
                    options={programOptions}
                    onChange={(event) =>
                      setProgram(event.target.value as typeof program)
                    }
                    data-testid="card-installment-program"
                    required
                  />
                  <NumberField
                    id="card-installment-term"
                    label={t("installmentTermLabel")}
                    value={termCount}
                    onChange={setTermCount}
                    minValue={1}
                    maxValue={120}
                    step={1}
                    required
                    data-testid="card-installment-term"
                  />
                  <div className="flex flex-wrap gap-(--space-2)">
                    {CARD_INSTALLMENT_TERM_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        variant={preset === termCount ? "primary" : "secondary"}
                        size="sm"
                        onPress={() => setTermCount(preset)}
                      >
                        {t("installmentTermPreset", { count: preset })}
                      </Button>
                    ))}
                  </div>
                  <DatePickerField
                    id="card-installment-first-expected"
                    label={t("installmentStartLabel")}
                    value={firstExpectedDate}
                    onChange={setFirstExpectedDate}
                    required
                    data-testid="card-installment-first-expected"
                  />
                  {isFeeProgram ? (
                    <>
                      <LabeledSelect
                        label={t("feeTypeLabel")}
                        value={feeType}
                        options={[
                          {
                            id: CreditCardInstallmentFeeType.FIXED,
                            label: t("feeFixed"),
                          },
                          {
                            id: CreditCardInstallmentFeeType.PERCENTAGE,
                            label: t("feePercentage"),
                          },
                        ]}
                        onChange={(event) =>
                          setFeeType(event.target.value as typeof feeType)
                        }
                        required
                        data-testid="card-installment-fee-type"
                      />
                      {feeType === CreditCardInstallmentFeeType.FIXED ? (
                        <AmountField
                          id="card-installment-fee-amount"
                          label={t("conversionFeeAmountLabel")}
                          value={feeAmount}
                          onValueChange={setFeeAmount}
                          required
                        />
                      ) : (
                        <NumberField
                          id="card-installment-fee-percent"
                          label={t("conversionFeeRateLabel")}
                          value={feePercent}
                          onChange={setFeePercent}
                          minValue={0}
                          step={0.01}
                          required
                        />
                      )}
                      <LabeledSelect
                        label={t("feeTimingLabel")}
                        value={feeTiming}
                        options={[
                          {
                            id: CreditCardInstallmentFeeTiming.FIRST_EXPECTED_PERIOD,
                            label: t("feeFirst"),
                          },
                          {
                            id: CreditCardInstallmentFeeTiming.SPREAD_ACROSS_PERIODS,
                            label: t("feeSpread"),
                          },
                        ]}
                        onChange={(event) =>
                          setFeeTiming(event.target.value as typeof feeTiming)
                        }
                        required
                      />
                    </>
                  ) : null}
                  {isInterestProgram ? (
                    <NumberField
                      id="card-installment-interest-percent"
                      label={t("interestRateLabel")}
                      value={interestPercent}
                      onChange={setInterestPercent}
                      minValue={0}
                      step={0.01}
                      required
                    />
                  ) : null}
                  {isQuotedProgram ? (
                    <AmountField
                      id="card-installment-quoted-total"
                      label={t("quotedTotalLabel")}
                      value={quotedTotal}
                      onValueChange={setQuotedTotal}
                      required
                    />
                  ) : null}
                  <TextField
                    id="card-installment-note"
                    label={t("installmentNoteLabel")}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  {preview ? (
                    <div
                      className="flex flex-col gap-(--space-2) rounded-[var(--radius-card)] border border-border-subtle bg-surface-elevated px-(--space-3) py-(--space-3)"
                      data-testid="card-installment-preview"
                    >
                      <SectionHeader title={t("previewTitle")} />
                      <PreviewRow
                        label={t("originalPurchase")}
                        value={formatMoney(preview.principal)}
                      />
                      <PreviewRow
                        label={t("conversionFee")}
                        value={formatMoney(preview.conversionFeeAmount)}
                      />
                      <PreviewRow
                        label={t("interestCost")}
                        value={formatMoney(preview.interestAmount)}
                      />
                      <PreviewRow
                        label={t("totalExtraCost")}
                        value={formatMoney(preview.totalExtraCost)}
                      />
                      <PreviewRow
                        label={t("totalRepayment")}
                        value={formatMoney(preview.totalRepayment)}
                      />
                      <PreviewRow
                        label={t("firstExpected")}
                        value={`${formatMoney(preview.schedule[0]?.totalAmount ?? 0)} · ${preview.schedule[0]?.expectedDate ?? ""}`}
                      />
                      <PreviewRow
                        label={t("finalExpected")}
                        value={`${formatMoney(preview.schedule.at(-1)?.totalAmount ?? 0)} · ${preview.schedule.at(-1)?.expectedDate ?? ""}`}
                      />
                    </div>
                  ) : null}
                </>
              )}
              {error ? (
                <StatusAlert
                  variant="danger"
                  title={t("actionErrorTitle")}
                  description={t("installmentError")}
                />
              ) : null}
            </div>
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              variant="secondary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              onPress={() => {
                reset();
                setIsOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={!selected || !preview || isPending || !online}
              onPress={save}
              data-testid="card-installment-submit"
            >
              {isPending ? t("installmentSaving") : t("installmentSave")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>
      <Sheet
        isOpen={trackingToStop !== null}
        onOpenChange={(next) => {
          if (!next) closeStopTracking();
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("stopTrackingTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div
              className="flex flex-col gap-(--space-4)"
              data-testid="card-installment-stop-confirm"
            >
              <Text size="sm" tone="secondary">
                {t("stopTrackingBody")}
              </Text>
              {error ? (
                <StatusAlert
                  variant="danger"
                  title={t("actionErrorTitle")}
                  description={t("installmentError")}
                />
              ) : null}
            </div>
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              variant="secondary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              onPress={closeStopTracking}
            >
              {t("keepTracking")}
            </Button>
            <Button
              variant="danger"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending || !online}
              onPress={stopTracking}
            >
              {isPending ? t("stopTrackingSaving") : t("stopTracking")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-(--space-3)">
      <Text size="sm" tone="secondary">
        {label}
      </Text>
      <Text size="sm" className="shrink-0 tabular-nums font-medium">
        <FinancialValue>{value}</FinancialValue>
      </Text>
    </div>
  );
}
