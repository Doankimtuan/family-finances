import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarTxnRow } from "@/lib/jars/spending";

type Props = {
  rows: SpendingJarTxnRow[];
  locale: string;
  vi: boolean;
};

export function JarHistoryTransactionList({ rows, locale, vi }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {vi ? "Giao dịch trong tháng" : "Month Transactions"}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {vi ? "Không có giao dịch." : "No transactions."}
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
                  {row.entry_date} · {row.category_name ?? (vi ? "Không phân loại" : "Uncategorized")}
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
