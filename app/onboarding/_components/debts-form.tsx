"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { addDebtOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

export function DebtsForm() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addDebtOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [accounts, setAccounts] = useState<
    { id: string; name: string; type: string }[]
  >([]);

  useEffect(() => {
    async function loadAccounts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts")
        .select("id, name, type")
        .eq("is_archived", false)
        .neq("type", "credit_card"); // Cannot pay debt from another credit card
      if (data) setAccounts(data);
    }
    loadAccounts();
  }, []);

  const labelClasses = "text-sm font-semibold text-slate-700";

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
          <label htmlFor="name" className={labelClasses}>
            {vi ? "Tên khoản nợ" : "Debt name"}
          </label>
          <Input
            id="name"
            name="name"
            required
            placeholder={vi ? "Khoản vay VPBank" : "VPBank Mortgage"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="liabilityType" className={labelClasses}>
              {vi ? "Loại nợ" : "Type"}
            </label>
            <Select name="liabilityType" defaultValue="mortgage">
              <SelectTrigger id="liabilityType">
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
                <SelectItem value="other">{vi ? "Khác" : "Other"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dueDay" className={labelClasses}>
              {vi ? "Ngày thanh toán hàng tháng" : "Monthly Due Day"}
            </label>
            <Input
              id="dueDay"
              name="dueDay"
              type="number"
              min="1"
              max="31"
              required
              placeholder="e.g. 15"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="linkedAccountId" className={labelClasses}>
            {vi ? "Tài khoản thanh toán mặc định" : "Default Payment Account"}
          </label>
          <Select name="linkedAccountId">
            <SelectTrigger id="linkedAccountId">
              <SelectValue
                placeholder={vi ? "Chọn tài khoản" : "Select account"}
              />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="principalOriginal" className={labelClasses}>
              {vi ? "Gốc ban đầu (VND)" : "Original principal (VND)"}
            </label>
            <MoneyInput
              id="principalOriginal"
              name="principalOriginal"
              defaultValue={0}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="currentOutstanding" className={labelClasses}>
              {vi ? "Dư nợ hiện tại (VND)" : "Current outstanding (VND)"}
            </label>
            <MoneyInput
              id="currentOutstanding"
              name="currentOutstanding"
              defaultValue={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="annualRate" className={labelClasses}>
              {vi ? "Lãi suất năm (%)" : "Annual rate (%)"}
            </label>
            <Input
              id="annualRate"
              name="annualRate"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="repaymentMethod" className={labelClasses}>
              {vi ? "Phương thức trả nợ" : "Repayment method"}
            </label>
            <Select name="repaymentMethod" defaultValue="annuity">
              <SelectTrigger id="repaymentMethod">
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

      {(state.status === "error" || state.status === "success") &&
        state.message && (
          <p
            className={`text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
              state.status === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {state.message}
          </p>
        )}
    </form>
  );
}
