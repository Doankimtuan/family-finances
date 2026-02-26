"use client";

import { useActionState, useTransition } from "react";

import { addDebtOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { VndCurrencyInput } from "@/app/onboarding/_components/vnd-currency-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";

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
          <select
            id="liabilityType"
            name="liabilityType"
            defaultValue="mortgage"
            className={inputClasses}
          >
            <option value="mortgage">{vi ? "Thế chấp" : "Mortgage"}</option>
            <option value="family_loan">{vi ? "Vay gia đình" : "Family Loan"}</option>
            <option value="personal_loan">{vi ? "Vay cá nhân" : "Personal Loan"}</option>
            <option value="car_loan">{vi ? "Vay mua xe" : "Car Loan"}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="principalOriginal"
              className="text-sm font-semibold text-slate-700"
            >
              {vi ? "Gốc ban đầu (VND)" : "Original principal (VND)"}
            </label>
            <VndCurrencyInput
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
            <VndCurrencyInput
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
            <select
              id="repaymentMethod"
              name="repaymentMethod"
              defaultValue="annuity"
              className={inputClasses}
            >
              <option value="annuity">{vi ? "Tổng trả cố định" : "Equal total payment"}</option>
              <option value="equal_principal">{vi ? "Gốc cố định" : "Equal principal"}</option>
              <option value="flexible">{vi ? "Linh hoạt" : "Flexible"}</option>
            </select>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-6 text-base"
      >
        {isPending ? (vi ? "Đang lưu..." : "Saving...") : (vi ? "Thêm khoản nợ" : "Add Debt")}
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
