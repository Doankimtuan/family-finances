import type { LoadingContainerProps } from "@/lib/loading/types";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { cn } from "@/lib/utils";

export function LoadingContainer({
  variant = "section",
  header,
  footer = <BottomTabBar />,
  children,
  isLoading = true,
  state = "loading",
  error,
  className,
}: LoadingContainerProps) {
  const showLoading = isLoading || state === "loading";
  const showError = state === "error" && error;

  if (variant === "full-page") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <section
          className={cn(
            "mx-auto w-full max-w-3xl space-y-4",
            className,
          )}
          aria-busy={showLoading}
          aria-live="polite"
        >
          {showError ? error : children}
        </section>
      </main>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(showLoading && "animate-pulse", className)}
        aria-busy={showLoading}
        aria-live="polite"
      >
        {showError ? error : children}
      </div>
    );
  }

  return (
    <AppShell
      header={header}
      footer={footer}
      className={className}
    >
      <section
        className={cn("w-full space-y-4", className)}
        aria-busy={showLoading}
        aria-live="polite"
      >
        {showError ? error : children}
      </section>
    </AppShell>
  );
}
