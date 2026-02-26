import { formatVnd } from "@/lib/dashboard/format";
import type { ValuationPoint } from "@/lib/assets/timeline";

type ValuationTimelineProps = {
  data: ValuationPoint[];
};

export function ValuationTimeline({ data }: ValuationTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No valuation timeline yet. Add quantity and price snapshots to see trend.
      </div>
    );
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">Valuation Timeline</p>

      <div className="flex h-36 items-end gap-2 overflow-x-auto">
        {data.map((point) => {
          const ratio = Math.max(point.value / max, 0.06);
          return (
            <div key={point.date} className="flex min-w-[44px] flex-col items-center gap-2">
              <div
                className="w-8 rounded-t-md bg-indigo-600"
                style={{ height: `${Math.round(ratio * 100)}%` }}
                title={`${new Date(point.date).toLocaleDateString("en-US")}: ${formatVnd(point.value)}`}
              />
              <span className="text-[10px] text-slate-500">{new Date(point.date).toLocaleDateString("en-US", { month: "short" })}</span>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Date</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Quantity</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Unit Price</th>
              <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date} className="border-b border-slate-100 last:border-b-0">
                <td className="px-3 py-2 text-sm text-slate-700">{new Date(point.date).toLocaleDateString("en-US")}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{point.quantity.toLocaleString("en-US")}</td>
                <td className="px-3 py-2 text-sm text-slate-700">{formatVnd(point.unitPrice)}</td>
                <td className="px-3 py-2 text-sm font-medium text-slate-900">{formatVnd(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
