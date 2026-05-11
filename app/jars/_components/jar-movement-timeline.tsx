"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/providers/i18n-provider";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";

type JarEvent = {
  id: string;
  event_type: string;
  source_type: string | null;
  occurred_at: string;
  payload: Record<string, unknown>;
  actor_user_id: string | null;
};

type JarMovement = {
  id: string;
  movement_type: string;
  amount: number;
  balance_delta: number;
  month: string;
  created_at: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

type TimelineItem = {
  id: string;
  type: "event" | "movement";
  date: string;
  title: string;
  description: string;
  amount?: number;
  isNegative?: boolean;
};

function getEventIcon(eventType: string): string {
  if (eventType.startsWith("allocation.")) return "💰";
  if (eventType.startsWith("jar.")) return "🫙";
  if (eventType.startsWith("month_close.")) return "📅";
  if (eventType.startsWith("overspend.")) return "⚠️";
  if (eventType.startsWith("rule.")) return "📋";
  if (eventType.startsWith("correction.")) return "🔧";
  if (eventType.startsWith("snapshot.")) return "📸";
  return "📌";
}

function getEventTitle(eventType: string, t: (key: string) => string): string {
  const titles: Record<string, string> = {
    "allocation.auto_resolved": t("jars.timeline.allocation_auto"),
    "allocation.review_created": t("jars.timeline.review_created"),
    "allocation.manual_resolved": t("jars.timeline.allocation_manual"),
    "jar.created": t("jars.timeline.jar_created"),
    "jar.updated": t("jars.timeline.jar_updated"),
    "jar.archived": t("jars.timeline.jar_archived"),
    "jar.transfer_created": t("jars.timeline.transfer"),
    "month_close.previewed": t("jars.timeline.month_close_preview"),
    "month_close.approved": t("jars.timeline.month_close_approved"),
    "overspend.covered": t("jars.timeline.overspend_covered"),
    "rule.changed": t("jars.timeline.rule_changed"),
    "rule.bulk_updated": t("jars.timeline.rule_bulk"),
    "correction.created": t("jars.timeline.correction"),
    "snapshot.generated": t("jars.timeline.snapshot"),
  };
  return titles[eventType] || eventType;
}

function getMovementTitle(movementType: string, t: (key: string) => string): string {
  const titles: Record<string, string> = {
    allocation_income: t("jars.timeline.allocation_in"),
    allocation_manual: t("jars.timeline.allocation_manual"),
    expense_spend: t("jars.timeline.expense_spend"),
    jar_transfer_in: t("jars.timeline.transfer_in"),
    jar_transfer_out: t("jars.timeline.transfer_out"),
    rollover_carry_forward: t("jars.timeline.rollover_in"),
    rollover_sweep_in: t("jars.timeline.rollover_sweep_in"),
    rollover_sweep_out: t("jars.timeline.rollover_sweep_out"),
    overspend_cover_in: t("jars.timeline.cover_in"),
    overspend_cover_out: t("jars.timeline.cover_out"),
    correction_in: t("jars.timeline.correction_in"),
    correction_out: t("jars.timeline.correction_out"),
  };
  return titles[movementType] || movementType;
}

export function JarMovementTimeline({
  jarId,
  householdId,
  locale = "vi-VN",
}: {
  jarId: string;
  householdId: string;
  locale?: string;
}) {
  const { t } = useI18n();
  const [events, setEvents] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeline() {
      const supabase = createClient();
      
      const [eventsResult, movementsResult] = await Promise.all([
        supabase
          .from("jar_events")
          .select("*")
          .eq("household_id", householdId)
          .eq("jar_id", jarId)
          .order("occurred_at", { ascending: false })
          .limit(50),
        supabase
          .from("jar_movements")
          .select("*")
          .eq("household_id", householdId)
          .eq("jar_id", jarId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const timelineItems: TimelineItem[] = [];

      if (eventsResult.data) {
        (eventsResult.data as JarEvent[]).forEach((event) => {
          timelineItems.push({
            id: event.id,
            type: "event",
            date: event.occurred_at,
            title: getEventTitle(event.event_type, t),
            description: event.source_type || "",
          });
        });
      }

      if (movementsResult.data) {
        (movementsResult.data as JarMovement[]).forEach((movement) => {
          let description = movement.description || "";
          
          if (movement.movement_type === "allocation_manual" && movement.metadata?.sourceAssetId) {
            description = `${t("jars.funding.from_asset")}: ${String(movement.metadata.sourceAssetId).slice(0, 8)}...`;
          }
          
          timelineItems.push({
            id: movement.id,
            type: "movement",
            date: movement.created_at,
            title: getMovementTitle(movement.movement_type, t),
            description,
            amount: Math.abs(movement.amount),
            isNegative: movement.balance_delta < 0,
          });
        });
      }

      timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(timelineItems.slice(0, 30));
      setIsLoading(false);
    }

    fetchTimeline();
  }, [jarId, householdId, t]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">{t("jars.timeline.empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white">
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-border/60">
          {events.map((item) => (
            <div key={item.id} className="flex gap-3 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm">
                {item.type === "event" ? "📋" : item.isNegative ? "📤" : "📥"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.title}
                  </p>
                  {item.amount !== undefined && (
                    <span
                      className={`text-sm font-semibold ${
                        item.isNegative ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {item.isNegative ? "-" : "+"}
                      {formatVndCompact(item.amount, locale)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {item.description || new Date(item.date).toLocaleString(locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
