"use client";

import { useActionState, useTransition, useState, useEffect } from "react";

import { addAccountOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AccountsForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<OnboardingActionState, FormData>(
    addAccountOnboardingAction,
    initialOnboardingActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [accountType, setAccountType] = useState("checking");
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    if (accountType !== "credit_card") return;
    const supabase = createClient();
    supabase
      .from("accounts")
      .select("id, name")
      .eq("is_archived", false)
      .is("deleted_at", null)
      .neq("type", "credit_card")
      .then(({ data }) => {
        if (data) setBankAccounts(data);
      });
  }, [accountType]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="name">{t("accounts.name")}</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("accounts.placeholder")}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="type">{t("accounts.type")}</Label>
        <Select
          name="type"
          defaultValue="checking"
          onValueChange={setAccountType}
        >
          <SelectTrigger
            id="type"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
          >
            <SelectValue placeholder={t("accounts.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checking">
              {t("accounts.type.checking")}
            </SelectItem>
            <SelectItem value="savings">
              {t("accounts.type.savings")}
            </SelectItem>
            <SelectItem value="cash">{t("accounts.type.cash")}</SelectItem>
            <SelectItem value="ewallet">
              {t("accounts.type.ewallet")}
            </SelectItem>
            <SelectItem value="credit_card">
              {t("accounts.type.credit_card")}
            </SelectItem>
            <SelectItem value="other">{t("accounts.type.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Credit card specific fields */}
      {accountType === "credit_card" && (
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">
            {t("accounts.credit_card_settings")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="creditLimit">
                {t("accounts.credit_limit")}
              </Label>
              <MoneyInput
                id="creditLimit"
                name="creditLimit"
                defaultValue={0}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="statementDay">
                {t("accounts.statement_day")}
              </Label>
              <Input
                id="statementDay"
                name="statementDay"
                type="number"
                min="1"
                max="31"
                defaultValue="25"
                placeholder="25"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="linkedBankAccountId">
              {t("accounts.linked_bank_account")}
            </Label>
            <Select name="linkedBankAccountId">
              <SelectTrigger id="linkedBankAccountId">
                <SelectValue
                  placeholder={t("accounts.select_payment_account")}
                />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
                {bankAccounts.length === 0 && (
                  <SelectItem value="_none" disabled>
                    {t("accounts.no_bank_accounts")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="openingBalance">{t("accounts.opening_balance")}</Label>
        <MoneyInput
          id="openingBalance"
          name="openingBalance"
          defaultValue={0}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? t("accounts.saving") : t("accounts.create")}
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
