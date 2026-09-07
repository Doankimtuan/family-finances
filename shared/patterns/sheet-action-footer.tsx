import { Button, ButtonVariant } from "@/shared/ui/button";
import { ActionSheetLayout } from "./action-sheet-layout";

type SheetActionFooterPrimaryVariant =
  typeof ButtonVariant.PRIMARY | typeof ButtonVariant.DANGER;

type SheetActionFooterProps = {
  secondaryLabel: string;
  primaryLabel: string;
  onSecondary: () => void;
  onPrimary: () => void;
  primaryTestId?: string;
  primaryVariant?: SheetActionFooterPrimaryVariant;
  /** Disables both actions (e.g. offline). Prefer `isPrimaryDisabled` for form validity. */
  isDisabled?: boolean;
  /** Disables only the primary action so Cancel / Back stay available. */
  isPrimaryDisabled?: boolean;
  isPending?: boolean;
};

/** Canonical sticky actions for two-step mobile Sheets. */
export function SheetActionFooter({
  secondaryLabel,
  primaryLabel,
  onSecondary,
  onPrimary,
  primaryTestId,
  primaryVariant = ButtonVariant.PRIMARY,
  isDisabled = false,
  isPrimaryDisabled = false,
  isPending = false,
}: SheetActionFooterProps) {
  const secondaryDisabled = isDisabled || isPending;
  const primaryDisabled = secondaryDisabled || isPrimaryDisabled;

  return (
    <ActionSheetLayout.Footer>
      <Button
        variant={ButtonVariant.SECONDARY}
        fullWidth
        className="min-h-11 min-w-0 flex-1 shadow-none"
        isDisabled={secondaryDisabled}
        onPress={onSecondary}
      >
        {secondaryLabel}
      </Button>
      <Button
        variant={primaryVariant}
        fullWidth
        className="min-h-11 min-w-0 flex-1"
        data-testid={primaryTestId}
        isDisabled={primaryDisabled}
        isPending={isPending}
        onPress={onPrimary}
      >
        {primaryLabel}
      </Button>
    </ActionSheetLayout.Footer>
  );
}
