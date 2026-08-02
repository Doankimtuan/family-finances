import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppViewport } from "@/shared/patterns/app-viewport";

export type ChromeShellProps = {
  chrome: "auth" | "product";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * AppViewport + chrome region + scrollable main + optional footer (e.g. BottomNav).
 */
export function ChromeShell({
  chrome,
  children,
  footer,
  className,
}: ChromeShellProps) {
  return (
    <AppViewport>
      <div
        data-chrome={chrome}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas",
          className,
        )}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {children}
        </main>
        {footer}
      </div>
    </AppViewport>
  );
}
