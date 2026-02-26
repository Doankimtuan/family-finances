import { formatVnd } from "@/lib/dashboard/format";

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  description: string | null;
  category_name: string | null;
  account_name: string | null;
  counterparty_account_name: string | null;
  member_name: string | null;
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
                {item.type === "income"
                  ? `Income · ${item.category_name ?? "Uncategorized"}`
                  : item.type === "transfer"
                    ? `Transfer · ${item.account_name ?? "Unknown"} -> ${item.counterparty_account_name ?? "Unknown"}`
                    : `Expense · ${item.category_name ?? "Uncategorized"}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.account_name ?? "Unknown account"} · {new Date(item.transaction_date).toLocaleDateString("en-US")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Logged by {item.member_name ?? "Household member"}</p>
              {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
            </div>
            <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-600" : item.type === "transfer" ? "text-slate-700" : "text-rose-600"}`}>
              {item.type === "income" ? "+" : item.type === "transfer" ? "\u2192" : "-"}{formatVnd(item.amount)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
