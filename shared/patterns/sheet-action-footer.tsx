import { Button } from "@/shared/ui/button";
import { ActionSheetLayout } from "./action-sheet-layout";

type SheetActionFooterProps = {
  secondaryLabel: string;
  primaryLabel: string;
  onSecondary: () => void;
  onPrimary: () => void;
  primaryTestId?: string;
  isDisabled?: boolean;
  isPending?: boolean;
};

/** Canonical sticky actions for two-step mobile Sheets. */
export function SheetActionFooter({
  secondaryLabel,
  primaryLabel,
  onSecondary,
  onPrimary,
  primaryTestId,
  isDisabled = false,
  isPending = false,
}: SheetActionFooterProps) {
  return (
    <ActionSheetLayout.Footer>
      <Button
        variant="secondary"
        fullWidth
        className="min-h-11 min-w-0 flex-1 shadow-none"
        isDisabled={isDisabled || isPending}
        onPress={onSecondary}
      >
        {secondaryLabel}
      </Button>
      <Button
        variant="primary"
        fullWidth
        className="min-h-11 min-w-0 flex-1"
        data-testid={primaryTestId}
        isDisabled={isDisabled || isPending}
        isPending={isPending}
        onPress={onPrimary}
      >
        {primaryLabel}
      </Button>
    </ActionSheetLayout.Footer>
  );
}
