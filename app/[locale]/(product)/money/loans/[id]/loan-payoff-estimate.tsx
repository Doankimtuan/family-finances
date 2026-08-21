"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { estimateEarlyPayoffComponents } from "@/modules/ledger/application/client";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { formatCurrency } from "@/shared/i18n/formatters";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";

type Props = {
  remainingPrincipal: number;
  currency: string;
  asOfDate: string;
};

/**
 * Read-only early-payoff estimate. Does not move money or close the loan.
 */
export function LoanPayoffEstimate(props: Props) {
  const t = useTranslations("money.loanDetail.payoffEstimate");
  const [open, setOpen] = useState(false);

  return (
    <Sheet isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-payoff-estimate-open"
        onPress={() => setOpen(true)}
      >
        {t("open")}
      </Button>
      {open ? (
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading>{t("title")}</Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <LoanPayoffEstimateFlow {...props} onClose={() => setOpen(false)} />
          </ActionSheetLayout.Body>
        </ActionSheetLayout>
      ) : null}
    </Sheet>
  );
}

function LoanPayoffEstimateFlow({
  remainingPrincipal,
  currency,
  asOfDate,
  onClose,
}: Props & { onClose: () => void }) {
  const t = useTranslations("money.loanDetail.payoffEstimate");
  const locale = useLocale();
  const money = (n: number) =>
    formatCurrency(n, currency, locale, { maximumFractionDigits: 0 });

  const estimate = estimateEarlyPayoffComponents({
    remainingPrincipal,
    asOfDate,
  });

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-md border border-border-subtle bg-surface p-(--space-4)"
      data-testid="loan-payoff-estimate"
    >
      <StatusAlert
        variant="info"
        title={t("title")}
        description={t("notQuote")}
      />
      <ConfirmSummary
        className="border-0 bg-transparent p-0"
        rows={[
          {
            id: "principal",
            label: t("principal"),
            value: money(estimate.remainingPrincipal),
          },
          {
            id: "interest",
            label: t("accruedInterest"),
            value: t("unknown"),
          },
          {
            id: "asOf",
            label: t("asOf"),
            value: estimate.asOfDate,
          },
          {
            id: "total",
            label: t("total"),
            value: t("incomplete"),
          },
        ]}
      />
      <Text size="sm" tone="secondary">
        {t("incompleteHint")}
      </Text>
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        data-testid="loan-payoff-estimate-close"
        onPress={onClose}
      >
        {t("close")}
      </Button>
    </div>
  );
}
