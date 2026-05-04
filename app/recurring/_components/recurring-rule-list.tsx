"use client";

import { useTransition } from "react";
import { Repeat, Wallet, Tag, Calendar, Pause, Play, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatVndCompact } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import type { AppLanguage } from "@/lib/i18n/config";

import { toggleRecurringRule, deleteRecurringRule } from "../actions";

interface RecurringRule {
  id: string;
  template_json: {
    type: "income" | "expense";
    amount: number;
    description: string;
    account_id: string;
    category_id?: string;
  };
  frequency: "weekly" | "monthly";
  interval: number;
  day_of_month?: number;
  day_of_week?: number;
  start_date: string;
  end_date?: string;
  next_run_date?: string;
  is_active: boolean;
}

interface RecurringRuleListProps {
  rules: RecurringRule[];
  accounts: Map<string, string>;
  categories: Map<string, string>;
  locale: string;
  language: AppLanguage;
}

export function RecurringRuleList({
  rules,
  accounts,
  categories,
  locale,
  language,
}: RecurringRuleListProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(() => {
      toggleRecurringRule(id, !currentActive);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t(language, "recurring.confirm_delete"))) {
      return;
    }
    startTransition(() => {
      const formData = new FormData();
      formData.append("id", id);
      deleteRecurringRule(null, formData);
    });
  };

  const getFrequencyLabel = (rule: RecurringRule) => {
    const monthlyLabel = t(language, "recurring.monthly");
    const weeklyLabel = t(language, "recurring.weekly");

    if (rule.frequency === "monthly") {
      if (rule.interval === 1) {
        return rule.day_of_month
          ? `${monthlyLabel} (${rule.day_of_month})`
          : monthlyLabel;
      }
      return `${rule.interval}x ${monthlyLabel.toLowerCase()}`;
    }
    if (rule.frequency === "weekly") {
      const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const daysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const days = language === "vi" ? daysVi : daysEn;
      if (rule.interval === 1) {
        return rule.day_of_week !== undefined
          ? `${weeklyLabel} (${days[rule.day_of_week]})`
          : weeklyLabel;
      }
      return `${rule.interval}x ${weeklyLabel.toLowerCase()}`;
    }
    return rule.frequency;
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {rules.map((rule) => (
        <Card
          key={rule.id}
          className={cn(
            "group overflow-hidden transition-all duration-300",
            rule.is_active
              ? "hover:border-primary/30"
              : "opacity-75 hover:opacity-100"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  rule.template_json.type === "income"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                )}
              >
                <Repeat className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {rule.template_json.description}
                  </h3>
                  <Badge
                    variant={rule.template_json.type === "income" ? "success" : "destructive"}
                    className="text-[10px] uppercase font-bold shrink-0"
                  >
                    {rule.template_json.type === "income" ? t(language, "common.income") : t(language, "common.expense")}
                  </Badge>
                  {!rule.is_active && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {t(language, "recurring.paused")}
                    </Badge>
                  )}
                </div>

                <p
                  className={cn(
                    "text-lg font-bold",
                    rule.template_json.type === "income"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  )}
                >
                  {rule.template_json.type === "income" ? "+" : "-"}
                  {formatVndCompact(rule.template_json.amount, locale)}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {getFrequencyLabel(rule)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    {accounts.get(rule.template_json.account_id) || "Unknown"}
                  </span>
                  {rule.template_json.category_id && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {categories.get(rule.template_json.category_id) || "Unknown"}
                    </span>
                  )}
                </div>

                {rule.next_run_date && rule.is_active && (
                  <p className="text-xs text-muted-foreground">
                    {t(language, "recurring.next_run")}: {rule.next_run_date}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                  disabled={isPending}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(rule.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
