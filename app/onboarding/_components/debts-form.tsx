"use client";

import { useActionState, useTransition } from "react";

import { addDebtOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DebtsForm() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addDebtOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();

  const inputClasses =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-50";

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="text-sm font-semibold text-slate-700"
          >
            {vi ? "Tên khoản nợ" : "Debt name"}
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder={vi ? "Khoản vay VPBank" : "VPBank Mortgage"}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="liabilityType"
            className="text-sm font-semibold text-slate-700"
          >
            {vi ? "Loại" : "Type"}
          </label>
          <Select name="liabilityType" defaultValue="mortgage">
            <SelectTrigger id="liabilityType" className={inputClasses}>
              <SelectValue placeholder={vi ? "Loại" : "Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mortgage">
                {vi ? "Thế chấp" : "Mortgage"}
              </SelectItem>
              <SelectItem value="family_loan">
                {vi ? "Vay gia đình" : "Family Loan"}
              </SelectItem>
              <SelectItem value="personal_loan">
                {vi ? "Vay cá nhân" : "Personal Loan"}
              </SelectItem>
              <SelectItem value="car_loan">
                {vi ? "Vay mua xe" : "Car Loan"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="principalOriginal"
              className="text-sm font-semibold text-slate-700"
            >
              {vi ? "Gốc ban đầu (VND)" : "Original principal (VND)"}
            </label>
            <MoneyInput
              id="principalOriginal"
              name="principalOriginal"
              defaultValue={0}
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="currentOutstanding"
              className="text-sm font-semibold text-slate-700"
            >
              {vi ? "Dư nợ hiện tại (VND)" : "Current outstanding (VND)"}
            </label>
            <MoneyInput
              id="currentOutstanding"
              name="currentOutstanding"
              defaultValue={0}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="annualRate"
              className="text-sm font-semibold text-slate-700"
            >
              {vi ? "Lãi suất năm (%)" : "Annual rate (%)"}
            </label>
            <input
              id="annualRate"
              name="annualRate"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className={inputClasses}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="repaymentMethod"
              className="text-sm font-semibold text-slate-700"
            >
              {vi ? "Phương thức trả nợ" : "Repayment method"}
            </label>
            <Select name="repaymentMethod" defaultValue="annuity">
              <SelectTrigger id="repaymentMethod" className={inputClasses}>
                <SelectValue
                  placeholder={vi ? "Phương thức trả nợ" : "Repayment method"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annuity">
                  {vi ? "Tổng trả cố định" : "Equal total payment"}
                </SelectItem>
                <SelectItem value="equal_principal">
                  {vi ? "Gốc cố định" : "Equal principal"}
                </SelectItem>
                <SelectItem value="flexible">
                  {vi ? "Linh hoạt" : "Flexible"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-6 text-base"
      >
        {isPending
          ? vi
            ? "Đang lưu..."
            : "Saving..."
          : vi
            ? "Thêm khoản nợ"
            : "Add Debt"}
      </Button>

      {state.status === "error" && state.message ? (
        <p className="text-sm font-medium text-rose-600 animate-in fade-in slide-in-from-top-1">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" && state.message ? (
        <p className="text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
