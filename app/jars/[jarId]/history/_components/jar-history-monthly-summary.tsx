import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarHistoryRow } from "@/lib/jars/spending";

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  rows: SpendingJarHistoryRow[];
  locale: string;
  language: string;
};

export function JarHistoryMonthlySummary({ rows, locale, language }: Props) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {t("jars.history.summary_title")}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("common.no_data")}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.jar_id}-${row.month}`}
              className="rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{row.month}</p>
                <p className="text-xs text-muted-foreground">
                  {row.usage_percent === null
                    ? "—"
                    : `${Number(row.usage_percent).toFixed(1)}%`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatVndCompact(Number(row.monthly_spent ?? 0), locale)} /{" "}
                {formatVndCompact(Number(row.monthly_limit ?? 0), locale)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
