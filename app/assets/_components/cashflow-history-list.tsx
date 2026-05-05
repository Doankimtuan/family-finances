import { formatVnd } from "@/lib/dashboard/format";
import { OUTBOUND_FLOW_TYPES, CASHFLOW_HISTORY_LIMIT } from "@/app/assets/_lib/constants";
import { getCashflowLabel, type CashflowFlowType } from "@/lib/assets/class-config";

type CashflowRow = {
  id: string;
  flow_date: string;
  flow_type: string;
  amount: number;
  source_account_id: string | null;
  destination_account_id: string | null;
};

type CashflowHistoryListProps = {
  cashflows: CashflowRow[];
  accountMap: Map<string, string>;
  assetClass: string;
  householdLocale: string;
  t: (key: string) => string;
};

export function CashflowHistoryList({
  cashflows,
  accountMap,
  assetClass,
  householdLocale,
  t,
}: CashflowHistoryListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">
        {t("assets.cashflow_history")}
      </h3>
      <ul className="space-y-2">
        {cashflows.length === 0 ? (
          <li className="text-sm text-slate-500 italic">
            {t("assets.no_cashflows")}
          </li>
        ) : (
          cashflows.slice(0, CASHFLOW_HISTORY_LIMIT).map((cf) => {
            const isOutbound = OUTBOUND_FLOW_TYPES.includes(cf.flow_type);
            const sign = isOutbound ? "+" : "-";
            const accountId = isOutbound
              ? cf.source_account_id
              : cf.destination_account_id;
            const accountName = accountId
              ? (accountMap.get(accountId) ?? "Unknown account")
              : "Unknown account";
            const cfLabel = getCashflowLabel(
              assetClass,
              cf.flow_type as CashflowFlowType,
              t,
            );
            const amountColor = isOutbound ? "text-emerald-600" : "text-rose-600";

            return (
              <li
                key={cf.id}
                className="text-sm flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100"
              >
                <div>
                  <p className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider">
                    {cfLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {cf.flow_date} · {accountName}
                  </p>
                </div>
                <div className={`font-bold ${amountColor}`}>
                  {sign}
                  {formatVnd(Number(cf.amount), householdLocale)}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
