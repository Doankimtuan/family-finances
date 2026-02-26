import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

type OnboardingShellProps = {
  title: string;
  description: string;
  step: number;
  children: React.ReactNode;
  nextHref?: string;
  prevHref?: string;
};

const TOTAL_STEPS = 8;

export function OnboardingShell({
  title,
  description,
  step,
  children,
  nextHref,
  prevHref,
}: OnboardingShellProps) {
  const progress = Math.min(
    Math.max(Math.round((step / TOTAL_STEPS) * 100), 0),
    100,
  );

  return (
    <AppShell
      header={<AppHeader title="Setup Household" />}
      footer={
        <div className="flex items-center justify-between gap-3 p-4">
          {prevHref ? (
            <Button variant="outline" asChild className="flex-1">
              <a href={prevHref}>Back</a>
            </Button>
          ) : (
            <div className="flex-1" />
          )}

          {nextHref ? (
            <Button asChild className="flex-1">
              <a href={nextHref}>Continue</a>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <header className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </article>
      </div>
    </AppShell>
  );
}
