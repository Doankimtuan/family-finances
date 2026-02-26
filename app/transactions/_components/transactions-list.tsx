import { formatVnd } from "@/lib/dashboard/format";

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  description: string | null;
  category_name: string | null;
  account_name: string | null;
};

export function TransactionsList({ items }: { items: TransactionItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No transactions yet. Use Quick Add to log your first one.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.type === "income" ? "Income" : "Expense"} · {item.category_name ?? "Uncategorized"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.account_name ?? "Unknown account"} · {new Date(item.transaction_date).toLocaleDateString("en-US")}
              </p>
              {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
            </div>
            <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
              {item.type === "income" ? "+" : "-"}{formatVnd(item.amount)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
