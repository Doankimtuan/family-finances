import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarCategoryBreakdownRow } from "@/lib/jars/spending";

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  rows: SpendingJarCategoryBreakdownRow[];
  locale: string;
  language: string;
};

export function JarHistoryCategoryBreakdown({ rows, locale, language }: Props) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {t("jars.history.category_breakdown")}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("jars.history.no_category_data")}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.category_id ?? "uncat"}-${row.category_name}`}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3"
            >
              <p className="text-sm font-medium">{row.category_name}</p>
              <p className="text-sm font-bold">
                {formatVndCompact(Number(row.amount ?? 0), locale)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
