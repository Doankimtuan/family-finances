"use client";

import { History, HeartPulse, Sparkles, Target, Wallet, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useI18n } from "@/lib/providers/i18n-provider";
import { QuickAction } from "./ui";

export function QuickActionsSection({
  jarsEnabled,
  financialHealthEnabled,
}: {
  jarsEnabled: boolean;
  financialHealthEnabled: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-transparent bg-transparent shadow-none">
      <CardHeader className="px-0">
        <SectionHeader
          icon={History}
          label={t("dashboard.shortcuts.label")}
          title={t("dashboard.shortcuts.title")}
        />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 px-0 sm:grid-cols-3 lg:grid-cols-6">
        <QuickAction
          href="/transactions"
          icon={History}
          label={t("dashboard.shortcuts.transactions")}
          variant="primary"
        />
        <QuickAction
          href="/money"
          icon={Wallet}
          label={t("dashboard.shortcuts.money")}
        />
        <QuickAction
          href="/goals"
          icon={Target}
          label={t("dashboard.shortcuts.goals")}
        />
        {jarsEnabled ? (
          <QuickAction
            href="/jars"
            icon={Sparkles}
            label={t("dashboard.shortcuts.jars")}
          />
        ) : null}
        {financialHealthEnabled ? (
          <QuickAction
            href="/health"
            icon={HeartPulse}
            label={t("dashboard.shortcuts.health")}
          />
        ) : null}
        <QuickAction
          href="/insights"
          icon={Zap}
          label={t("dashboard.shortcuts.insights")}
        />
      </CardContent>
    </Card>
  );
}
