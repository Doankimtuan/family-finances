"use client";

import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import {
  ConfirmSummary,
  type ConfirmSummaryRow,
} from "@/shared/patterns/confirm-summary";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";

type Props = {
  isOpen: boolean;
  isPending: boolean;
  isOnline: boolean;
  title: string;
  rows: ConfirmSummaryRow[];
  secondaryLabel: string;
  primaryLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Read-only capture confirmation overlay. Mutation stays in the entry form.
 */
export function CaptureTransactionConfirmSheet({
  isOpen,
  isPending,
  isOnline,
  title,
  rows,
  secondaryLabel,
  primaryLabel,
  onClose,
  onConfirm,
}: Props) {
  const close = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (next) return;
        close();
      }}
    >
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {title}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <ConfirmSummary data-testid="capture-confirm-summary" rows={rows} />
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={secondaryLabel}
          primaryLabel={primaryLabel}
          onSecondary={close}
          onPrimary={onConfirm}
          primaryTestId="capture-confirm"
          isPrimaryDisabled={!isOnline}
          isPending={isPending}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
