"use client";

import { HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/providers/i18n-provider";

type DashboardErrorProps = {
  error: Error;
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
      <section className="mx-auto w-full max-w-2xl">
        <EmptyState
          icon={HeartPulse}
          title={t("dashboard.error.title")}
          description={error.message}
          action={
            <Button onClick={reset} size="sm">
              {t("dashboard.error.retry")}
            </Button>
          }
          className="border-destructive/20 bg-destructive/5"
        />
      </section>
    </main>
  );
}
