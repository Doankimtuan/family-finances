"use client";

import { useActionState, useTransition } from "react";

import { createGoalAction } from "@/app/goals/actions";
import { initialGoalActionState, type GoalActionState } from "@/app/goals/action-types";
import { VndQuickInput } from "@/app/transactions/_components/vnd-quick-input";
import { useI18n } from "@/lib/providers/i18n-provider";

export function CreateGoalForm() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<GoalActionState, FormData>(
    createGoalAction,
    initialGoalActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="goalName" className="text-sm font-medium text-slate-700">{vi ? "Tên mục tiêu" : "Goal Name"}</label>
        <input
          id="goalName"
          name="name"
          required
          placeholder={vi ? "Mua đất tại Bình Dương" : "Buy land in Binh Duong"}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="goalType" className="text-sm font-medium text-slate-700">{vi ? "Loại" : "Type"}</label>
          <select
            id="goalType"
            name="goalType"
            defaultValue="property_purchase"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          >
            <option value="emergency_fund">{vi ? "Quỹ khẩn cấp" : "Emergency fund"}</option>
            <option value="property_purchase">{vi ? "Mua bất động sản" : "Property purchase"}</option>
            <option value="house_construction">{vi ? "Xây nhà" : "House construction"}</option>
            <option value="vehicle">{vi ? "Phương tiện" : "Vehicle"}</option>
            <option value="education">{vi ? "Giáo dục" : "Education"}</option>
            <option value="retirement">{vi ? "Nghỉ hưu" : "Retirement"}</option>
            <option value="custom">{vi ? "Tùy chỉnh" : "Custom"}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="priority" className="text-sm font-medium text-slate-700">{vi ? "Mức ưu tiên" : "Priority"}</label>
          <select
            id="priority"
            name="priority"
            defaultValue="1"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          >
            <option value="1">{vi ? "1 - Cao nhất" : "1 - Highest"}</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">{vi ? "5 - Thấp nhất" : "5 - Lowest"}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="targetAmount" className="text-sm font-medium text-slate-700">{vi ? "Số tiền mục tiêu (VND)" : "Target Amount (VND)"}</label>
          <VndQuickInput
            id="targetAmount"
            name="targetAmount"
            defaultValue={0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="targetDate" className="text-sm font-medium text-slate-700">{vi ? "Ngày mục tiêu (không bắt buộc)" : "Target Date (optional)"}</label>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : (vi ? "Tạo mục tiêu" : "Create Goal")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
