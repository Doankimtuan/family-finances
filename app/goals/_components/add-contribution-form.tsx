"use client";

import { useActionState, useTransition } from "react";
import { useMemo, useState } from "react";

import { addGoalContributionAction } from "@/app/goals/actions";
import {
  initialGoalActionState,
  type GoalActionState,
} from "@/app/goals/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccountOption = {
  id: string;
  name: string;
};

export function AddContributionForm({
  goalId,
  goalName,
  accounts,
}: {
  goalId: string;
  goalName: string;
  accounts: AccountOption[];
}) {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<GoalActionState, FormData>(
    addGoalContributionAction,
    initialGoalActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [flowType, setFlowType] = useState<"inflow" | "outflow">("inflow");
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");

  const sourceText = useMemo(() => {
    if (flowType === "inflow")
      return (
        accounts.find((a) => a.id === accountId)?.name ??
        (vi ? "Chọn tài khoản" : "Select account")
      );
    return goalName;
  }, [accountId, accounts, flowType, goalName, vi]);

  const destinationText = useMemo(() => {
    if (flowType === "inflow") return goalName;
    return (
      accounts.find((a) => a.id === accountId)?.name ??
      (vi ? "Chọn tài khoản" : "Select account")
    );
  }, [accountId, accounts, flowType, goalName, vi]);

  return (
    <form
      className="space-y-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="flowType" value={flowType} />

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setFlowType("inflow")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${flowType === "inflow" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
        >
          {vi ? "Tiền vào mục tiêu" : "Inflow to Goal"}
        </button>
        <button
          type="button"
          onClick={() => setFlowType("outflow")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${flowType === "outflow" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
        >
          {vi ? "Tiền ra khỏi mục tiêu" : "Outflow from Goal"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {vi ? "Nguồn" : "Source"}
          </p>
          <p className="text-sm font-medium text-slate-900">{sourceText}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {vi ? "Đích" : "Destination"}
          </p>
          <p className="text-sm font-medium text-slate-900">
            {destinationText}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Select
          name="accountId"
          value={accountId}
          onValueChange={(val) => setAccountId(val)}
          required
        >
          <SelectTrigger className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-sm text-slate-900">
            <SelectValue
              placeholder={vi ? "Chọn tài khoản" : "Select account"}
            />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <MoneyInput
          id={`amount-${goalId}`}
          name="amount"
          defaultValue={0}
          className="w-full"
          placeholder={vi ? "Số tiền" : "Amount"}
        />
        <input
          name="contributionDate"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
        />
        <button
          type="submit"
          disabled={isPending || !accountId}
          className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending
            ? vi
              ? "Đang lưu..."
              : "Saving..."
            : vi
              ? "Ghi dòng tiền"
              : "Record Flow"}
        </button>
      </div>

      <input
        name="note"
        placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
      />

      {state.status === "error" && state.message ? (
        <p className="text-xs text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-xs text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
