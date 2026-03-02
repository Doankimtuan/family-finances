import { formatVndCompact } from "@/lib/dashboard/format";

import { deleteJarLedgerEntryDirectAction } from "@/app/jars/actions";

type ActivityItem = {
  id: string;
  jar_name: string;
  entry_date: string;
  entry_type: "allocate" | "withdraw" | "adjust";
  amount: number;
  note: string | null;
};

type Props = {
  items: ActivityItem[];
  month: string;
  locale: string;
  vi: boolean;
};

function entryTypeLabel(type: ActivityItem["entry_type"], vi: boolean) {
  if (type === "allocate") return vi ? "Phân bổ" : "Allocate";
  if (type === "withdraw") return vi ? "Rút" : "Withdraw";
  return vi ? "Điều chỉnh" : "Adjust";
}

export function JarActivityList({ items, month, locale, vi }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {vi ? "Chưa có giao dịch hũ trong tháng này." : "No jar ledger entries for this month."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border p-3 flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {item.jar_name} · {entryTypeLabel(item.entry_type, vi)}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.entry_date}
              {item.note ? ` · ${item.note}` : ""}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-bold">
              {item.entry_type === "withdraw" ? "-" : "+"}
              {formatVndCompact(item.amount, locale)}
            </p>
            <form action={deleteJarLedgerEntryDirectAction}>
              <input type="hidden" name="entryId" value={item.id} />
              <input type="hidden" name="month" value={month} />
              <button className="text-xs text-destructive hover:underline" type="submit">
                {vi ? "Xóa" : "Delete"}
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
