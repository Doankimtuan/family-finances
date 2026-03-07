import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarHistoryRow } from "@/lib/jars/spending";

type Props = {
  rows: SpendingJarHistoryRow[];
  locale: string;
  vi: boolean;
};

export function JarHistoryMonthlySummary({ rows, locale, vi }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {vi ? "Tổng hợp theo tháng" : "Monthly Summary"}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {vi ? "Chưa có dữ liệu." : "No data yet."}
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
