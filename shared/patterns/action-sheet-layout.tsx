import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Sheet, SheetContent } from "./sheet";

type PartProps = {
  children?: ReactNode;
  className?: string;
};

function Header({ children, className }: PartProps) {
  return (
    <Sheet.Header
      className={cn(
        "flex-none px-(--space-4) pt-(--space-3) pb-(--space-2)",
        className,
      )}
      data-slot="action-sheet-header"
    >
      {children}
    </Sheet.Header>
  );
}

function Body({ children, className }: PartProps) {
  return (
    <Sheet.Body
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-(--space-4) pt-(--space-3) pb-[calc(var(--sheet-footer-clearance)+env(safe-area-inset-bottom,0px))]",
        className,
      )}
      data-slot="action-sheet-body"
    >
      {children}
    </Sheet.Body>
  );
}

function Footer({ children, className }: PartProps) {
  return (
    <Sheet.Footer
      className={cn(
        "sticky bottom-0 z-(--z-sticky) flex w-full flex-none items-stretch gap-(--space-2) border-t border-border-subtle bg-surface-elevated px-(--space-4) pt-(--space-3) pb-[calc(var(--sheet-footer-space)+env(safe-area-inset-bottom,0px))]",
        className,
      )}
      data-slot="action-sheet-footer"
    >
      {children}
    </Sheet.Footer>
  );
}

/**
 * Shared long-form Sheet composition. SheetContent owns the surface and handle;
 * these slots own the header, independently scrolling body, and safe-area-aware
 * sticky footer without adding a second card surface.
 */
export function ActionSheetLayout({ children, className }: PartProps) {
  return <SheetContent className={className}>{children}</SheetContent>;
}

ActionSheetLayout.Header = Header;
ActionSheetLayout.Body = Body;
ActionSheetLayout.Footer = Footer;
