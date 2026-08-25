"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { AppIcon, ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui";

type Props = {
  label: string;
  incomeHref: string;
  incomeLabel: string;
  valuationHref?: string;
  valuationLabel?: string;
};

/**
 * Detail overflow actions presented in the same bottom-sheet pattern as other
 * money resource screens.
 */
export function InvestmentMoreActions({
  label,
  incomeHref,
  incomeLabel,
  valuationHref,
  valuationLabel,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navigateTo = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      <IconButton
        aria-label={label}
        variant="secondary"
        data-testid="investment-more-actions"
        onPress={() => setIsOpen(true)}
      >
        <AppIcon icon={ACTION_ICONS.more} size="sm" />
      </IconButton>
      <Sheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {label}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <ul className="divide-y divide-border-subtle/70">
              <li>
                <Button
                  variant="ghost"
                  className="min-h-11 w-full justify-between px-0 text-left"
                  onPress={() => navigateTo(incomeHref)}
                >
                  <span className="flex min-w-0 items-center gap-(--space-2)">
                    <AppIcon icon={FINANCE_ICONS.income} size="sm" />
                    <span>{incomeLabel}</span>
                  </span>
                  <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                </Button>
              </li>
              {valuationHref && valuationLabel ? (
                <li>
                  <Button
                    variant="ghost"
                    className="min-h-11 w-full justify-between px-0 text-left"
                    onPress={() => navigateTo(valuationHref)}
                  >
                    <span className="flex min-w-0 items-center gap-(--space-2)">
                      <AppIcon icon={FINANCE_ICONS.investment} size="sm" />
                      <span>{valuationLabel}</span>
                    </span>
                    <AppIcon icon={ACTION_ICONS.forward} size="sm" />
                  </Button>
                </li>
              ) : null}
            </ul>
          </ActionSheetLayout.Body>
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
