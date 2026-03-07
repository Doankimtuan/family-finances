import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVndCompact } from "@/lib/dashboard/format";
import type { SpendingJarCategoryBreakdownRow } from "@/lib/jars/spending";

type Props = {
  rows: SpendingJarCategoryBreakdownRow[];
  locale: string;
  vi: boolean;
};

export function JarHistoryCategoryBreakdown({ rows, locale, vi }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-bold">
          {vi ? "Phân bổ theo danh mục" : "Category Breakdown"}
        </h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {vi ? "Không có dữ liệu danh mục." : "No category data."}
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
