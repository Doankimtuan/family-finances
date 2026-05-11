"use client";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/providers/i18n-provider";

export function JarClosedBanner({ month }: { month: string }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          {t("jars.month_close.closed_banner", { month })}
        </span>
        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
          {t("jars.month_close.read_only")}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-amber-700">
        {t("jars.month_close.closed_description")}
      </p>
    </div>
  );
}
