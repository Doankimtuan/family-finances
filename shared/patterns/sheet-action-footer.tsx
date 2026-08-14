import { Sheet } from "@/shared/patterns/sheet";
import { Button } from "@/shared/ui/button";

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
    <Sheet.Footer className="sticky bottom-0 z-10 flex w-full items-stretch gap-(--space-2) border-t border-border-subtle bg-surface-elevated px-(--space-4) pt-(--space-3) pb-[max(env(safe-area-inset-bottom),var(--space-3))]">
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
    </Sheet.Footer>
  );
}
