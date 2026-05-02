import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarTxnRow } from "@/lib/jars/spending";

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  rows: SpendingJarTxnRow[];
  locale: string;
  language: string;
};

export function JarHistoryTransactionList({ rows, locale, language }: Props) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {t("jars.history.transactions_title")}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("jars.history.no_transactions")}
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.source_type}-${row.entry_id}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3"
            >
              <div>
                <p className="text-sm font-semibold">{row.description}</p>
                <p className="text-xs text-muted-foreground">
                  {row.entry_date} · {row.category_name ?? t("common.uncategorized")}
                </p>
              </div>
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
