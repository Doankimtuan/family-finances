import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      header={
        <AppHeader
          title="Setup Household"
          subtitle={`Step ${step} of ${TOTAL_STEPS}`}
          rightAction={
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
              {progress}%
            </Badge>
          }
        />
      }
      footer={
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {prevHref ? (
            <Button variant="outline" asChild size="lg" className="w-full">
              <a href={prevHref}>Back</a>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextHref ? (
            <Button asChild size="lg" className="w-full">
              <a href={nextHref}>Continue</a>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <Card variant="elevated" className="overflow-hidden border-border/70 shadow-sm">
          <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge variant="outline" className="rounded-full border-primary/20 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Household setup
                </Badge>

                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </div>
              </div>

              <div className="hidden shrink-0 text-right md:block">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Progress
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {progress}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Step {step} of {TOTAL_STEPS}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Progress</span>
                <span>{progress}% complete</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/70 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5 sm:p-6">{children}</CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
