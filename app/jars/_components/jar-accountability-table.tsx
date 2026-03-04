import { formatVndCompact } from "@/lib/dashboard/format";

import { runJarReconciliationDirectAction } from "@/app/jars/actions";

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
        <p className="text-xs text-muted-foreground">
          {vi
            ? "Đối soát theo danh mục chi tiêu và phần phân bổ từ hũ."
            : "Reconciles category spend against allocated jar funding."}
        </p>
        <form action={runJarReconciliationDirectAction}>
          <input type="hidden" name="month" value={month} />
          <button
            className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            type="submit"
          >
            {vi ? "Đối soát lại" : "Recompute"}
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          {vi
            ? "Chưa có dữ liệu đối soát. Nhấn 'Đối soát lại' để tạo dữ liệu tháng này."
            : "No reconciliation rows yet. Click Recompute to generate this month."}
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
