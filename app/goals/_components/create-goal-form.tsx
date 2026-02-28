"use client";

import { useActionState, useTransition } from "react";

import { createGoalAction } from "@/app/goals/actions";
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
        <label
          htmlFor="goalName"
          className="text-sm font-medium text-slate-700"
        >
          {vi ? "Tên mục tiêu" : "Goal Name"}
        </label>
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
          <label
            htmlFor="goalType"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Loại" : "Type"}
          </label>
          <Select name="goalType" defaultValue="property_purchase">
            <SelectTrigger
              id="goalType"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder={vi ? "Chọn loại" : "Select type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emergency_fund">
                {vi ? "Quỹ khẩn cấp" : "Emergency fund"}
              </SelectItem>
              <SelectItem value="property_purchase">
                {vi ? "Mua bất động sản" : "Property purchase"}
              </SelectItem>
              <SelectItem value="house_construction">
                {vi ? "Xây nhà" : "House construction"}
              </SelectItem>
              <SelectItem value="vehicle">
                {vi ? "Phương tiện" : "Vehicle"}
              </SelectItem>
              <SelectItem value="education">
                {vi ? "Giáo dục" : "Education"}
              </SelectItem>
              <SelectItem value="retirement">
                {vi ? "Nghỉ hưu" : "Retirement"}
              </SelectItem>
              <SelectItem value="custom">
                {vi ? "Tùy chỉnh" : "Custom"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="priority"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Mức ưu tiên" : "Priority"}
          </label>
          <Select name="priority" defaultValue="1">
            <SelectTrigger
              id="priority"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder={vi ? "Ưu tiên" : "Priority"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                {vi ? "1 - Cao nhất" : "1 - Highest"}
              </SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">
                {vi ? "5 - Thấp nhất" : "5 - Lowest"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="targetAmount"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Số tiền mục tiêu (VND)" : "Target Amount (VND)"}
          </label>
          <MoneyInput
            id="targetAmount"
            name="targetAmount"
            defaultValue={0}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="targetDate"
            className="text-sm font-medium text-slate-700"
          >
            {vi ? "Ngày mục tiêu (không bắt buộc)" : "Target Date (optional)"}
          </label>
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
        {isPending
          ? vi
            ? "Đang lưu..."
            : "Saving..."
          : vi
            ? "Tạo mục tiêu"
            : "Create Goal"}
      </button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
