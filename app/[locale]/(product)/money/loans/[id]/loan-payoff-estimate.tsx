"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { estimateEarlyPayoffComponents } from "@/modules/ledger/application/client";
import { formatLoanDate } from "@/modules/ledger/ui/loan-presentation";
import { ConfirmSummary } from "@/shared/patterns/confirm-summary";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { formatCurrency } from "@/shared/i18n/formatters";

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
          <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
            <LoanPayoffEstimateBody {...props} />
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              variant="secondary"
              className="min-h-11 w-full"
              data-testid="loan-payoff-estimate-close"
              onPress={() => setOpen(false)}
            >
              {t("close")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      ) : null}
    </Sheet>
  );
}

function LoanPayoffEstimateBody({
  remainingPrincipal,
  currency,
  asOfDate,
}: Props) {
  const t = useTranslations("money.loanDetail.payoffEstimate");
  const locale = useLocale();
  const money = (n: number) =>
    formatCurrency(n, currency, locale, { maximumFractionDigits: 0 });

  const estimate = estimateEarlyPayoffComponents({
    remainingPrincipal,
    asOfDate,
  });
  const formattedAsOf =
    formatLoanDate(estimate.asOfDate, locale) ?? estimate.asOfDate;

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="loan-payoff-estimate"
    >
      <StatusAlert variant="info" title={t("notQuote")} />
      <ConfirmSummary
        className="border-0 bg-transparent p-0"
        rows={[
          {
            id: "principal",
            label: t("principal"),
            value: money(estimate.remainingPrincipal),
            kind: "financial",
          },
          {
            id: "interest",
            label: t("accruedInterest"),
            value: t("unknown"),
            kind: "text",
          },
          {
            id: "asOf",
            label: t("asOf"),
            value: formattedAsOf,
            kind: "text",
          },
          {
            id: "total",
            label: t("total"),
            value: (
              <Text size="sm" tone="secondary" className="font-medium">
                {t("incomplete")}
              </Text>
            ),
            kind: "text",
          },
        ]}
      />
      <Text size="sm" tone="secondary">
        {t("incompleteHint")}
      </Text>
    </div>
  );
}
