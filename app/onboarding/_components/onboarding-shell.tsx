import Link from "next/link";

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
  const progress = Math.min(Math.max(Math.round((step / TOTAL_STEPS) * 100), 0), 100);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-2xl space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Onboarding</p>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500">Step {step} of {TOTAL_STEPS}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{description}</p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {children}
        </article>

        <nav className="flex items-center justify-between gap-3">
          {prevHref ? (
            <Link
              href={prevHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back
            </Link>
          ) : <span />}

          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </Link>
          ) : null}
        </nav>
      </section>
    </main>
  );
}
