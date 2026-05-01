import { formatVndCompact } from "@/lib/dashboard/format";
import { runJarReconciliationDirectAction } from "@/app/jars/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Row = {
  id: string;
  category_name: string;
  jar_name: string;
  actual_amount: number;
  allocated_amount: number;
  gap_amount: number;
};

type Props = {
  rows: Row[];
  month: string;
  locale: string;
  vi: boolean;
};

export function JarAccountabilityTable({ rows, month, locale, vi }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground font-normal">
          {vi
            ? "So sánh chi tiêu thực tế với phần tiền đã phân bổ từ từng hũ."
            : "Compare actual spending with the money allocated from each jar."}
        </Label>
        <form action={runJarReconciliationDirectAction}>
          <input type="hidden" name="month" value={month} />
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="text-xs h-8"
          >
            {vi ? "Cập nhật lại dữ liệu" : "Refresh data"}
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          {vi
            ? "Chưa có dữ liệu so sánh. Nhấn 'Cập nhật lại dữ liệu' để làm mới tháng này."
            : "No comparison rows yet. Click Refresh data to rebuild this month."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">{vi ? "Danh mục" : "Category"}</th>
                <th className="px-3 py-2 font-semibold">{vi ? "Hũ" : "Jar"}</th>
                <th className="px-3 py-2 font-semibold">{vi ? "Chi thực tế" : "Actual"}</th>
                <th className="px-3 py-2 font-semibold">{vi ? "Phân bổ" : "Allocated"}</th>
                <th className="px-3 py-2 font-semibold">{vi ? "Chênh lệch" : "Gap"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const gapClass =
                  row.gap_amount > 0
                    ? "text-destructive"
                    : row.gap_amount < 0
                      ? "text-emerald-600"
                      : "text-muted-foreground";

                return (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">{row.category_name}</td>
                    <td className="px-3 py-2">{row.jar_name}</td>
                    <td className="px-3 py-2 font-medium">
                      {formatVndCompact(row.actual_amount, locale)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {formatVndCompact(row.allocated_amount, locale)}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${gapClass}`}>
                      {formatVndCompact(row.gap_amount, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
