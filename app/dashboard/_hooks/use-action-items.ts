"use client";

import { useMemo } from "react";
import type { DashboardCoreResponse } from "@/lib/dashboard/types";
import { formatDate, formatVndCompact } from "@/lib/dashboard/format";
import { formatCreditCardTitle } from "@/lib/dashboard/utils";

export type ActionItem = {
  id: string;
  title: string;
  description: string;
  amountLabel: string;
  metaLabel: string;
  href: string;
  tone: "warning" | "destructive";
};

/**
 * Hook to construct action items from dashboard data
 * @param payload - Dashboard response data
 * @param locale - Current locale for formatting
 * @param t - Translation function
 * @returns Array of action items sorted by priority
 */
export function useActionItems(
  payload: DashboardCoreResponse | null | undefined,
  locale: string,
  t: (key: string) => string,
): ActionItem[] {
  return useMemo(() => {
    if (!payload) return [];

    const items: ActionItem[] = [];

    // Jar review queue items
    if ((payload.pendingJarReviews ?? 0) > 0) {
      items.push({
        id: "jar-review-queue",
        title: t("dashboard.actions.jar_review_title"),
        description: t("dashboard.actions.jar_review_description"),
        amountLabel: `${payload.pendingJarReviews ?? 0} ${t("dashboard.actions.jar_review_count")}`,
        metaLabel: t("dashboard.actions.open_jars"),
        href: "/goals/jars/review",
        tone: "warning",
      });
    }

    // Credit card payment actions
    for (const action of payload.priorityActions ?? []) {
      items.push({
        id: `bill-${action.id}`,
        title: `${t("dashboard.actions.credit_card_title")} ${formatCreditCardTitle(action.title)}`,
        description: t("dashboard.actions.credit_card_description"),
        amountLabel: formatVndCompact(action.amount, locale),
        metaLabel: formatDate(action.dueDate, locale),
        href: "/debts",
        tone: "warning",
      });
    }

    // Spending jar alerts
    for (const alert of payload.spendingJarAlerts ?? []) {
      items.push({
        id: `jar-${alert.jarId}`,
        title: alert.jarName,
        description:
          alert.alertLevel === "exceeded"
            ? t("dashboard.actions.jar_exceeded")
            : t("dashboard.actions.jar_warning"),
        amountLabel: `${formatVndCompact(alert.spent, locale)} / ${formatVndCompact(alert.limit, locale)}`,
        metaLabel:
          alert.usagePercent === null ? "-" : `${alert.usagePercent.toFixed(1)}%`,
        href: "/goals?tab=jars",
        tone: alert.alertLevel === "exceeded" ? "destructive" : "warning",
      });
    }

    return items;
  }, [payload, locale, t]);
}
