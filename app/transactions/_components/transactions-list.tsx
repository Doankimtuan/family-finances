import { formatVnd } from "@/lib/dashboard/format";
import { formatDate } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";

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
  const { locale, t } = useI18n();

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{t("transactions.none")}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.type === "income"
                  ? `${t("transactions.income")} · ${item.category_name ?? t("transactions.uncategorized")}`
                  : item.type === "transfer"
                    ? `${t("transactions.transfer")} · ${item.account_name ?? t("transactions.unknown_account")} -> ${item.counterparty_account_name ?? t("transactions.unknown_account")}`
                    : `${t("transactions.expense")} · ${item.category_name ?? t("transactions.uncategorized")}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.account_name ?? t("transactions.unknown_account")} · {formatDate(item.transaction_date, locale)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{t("transactions.logged_by")} {item.member_name ?? t("transactions.household_member")}</p>
              {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
            </div>
            <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-600" : item.type === "transfer" ? "text-slate-700" : "text-rose-600"}`}>
              {item.type === "income" ? "+" : item.type === "transfer" ? "\u2192" : "-"}{formatVnd(item.amount, locale)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
