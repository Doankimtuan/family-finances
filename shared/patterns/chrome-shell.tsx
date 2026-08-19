import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { AppViewport } from "@/shared/patterns/app-viewport";

export type ChromeShellProps = {
  /** auth/system — no bottom nav; product — five-tab chrome. */
  chrome: "auth" | "system" | "product";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * AppViewport + chrome region + one scroll owner + optional footer (e.g. BottomNav).
 */
export function ChromeShell({
  chrome,
  children,
  footer,
  className,
}: ChromeShellProps) {
  return (
    <AppViewport hasBottomNavigation={chrome === "product"}>
      <div
        data-chrome={chrome}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas",
          className,
        )}
      >
        <main
          data-slot="shell-scroll-region"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
        >
          {children}
        </main>
        {footer ? <div className="shrink-0">{footer}</div> : null}
      </div>
    </AppViewport>
  );
}
