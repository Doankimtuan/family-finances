"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";

type ActionFeedItem = {
  id: string;
  title: string;
  description: string;
  amountLabel: string;
  metaLabel: string;
  href: string;
  tone: "warning" | "destructive";
};

export function ActionFeed({
  actionItems,
  timelineWidget,
}: {
  actionItems: ActionFeedItem[];
  timelineWidget?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={AlertCircle}
        label={t("dashboard.actions.label")}
        title={t("dashboard.actions.title")}
        description={t("dashboard.actions.description")}
      />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <Card className="border-border/60">
          <CardContent className="p-4">
            {actionItems.length > 0 ? (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        item.tone === "destructive"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/15 text-warning",
                      )}
                    >
                      {item.href === "/debts" ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {item.amountLabel}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.metaLabel}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title={t("dashboard.actions.empty.title")}
                description={t("dashboard.actions.empty.description")}
              />
            )}
          </CardContent>
        </Card>
        {timelineWidget}
      </div>
    </div>
  );
}
