"use client";

import { useActionState, useTransition, useState, useEffect } from "react";

import { addAccountOnboardingAction } from "@/app/onboarding/actions";
import {
  initialOnboardingActionState,
  type OnboardingActionState,
} from "@/app/onboarding/action-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/providers/i18n-provider";
import { createClient } from "@/lib/supabase/client";

import { OnboardingField, OnboardingStatusMessage } from "./onboarding-form";

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
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <OnboardingField
          htmlFor="name"
          label={t("accounts.name")}
          required
          hint={t("accounts.placeholder")}
        >
          <Input
            id="name"
            name="name"
            required
            placeholder={t("accounts.placeholder")}
            className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm"
          />
        </OnboardingField>

        <OnboardingField
          htmlFor="type"
          label={t("accounts.type")}
          hint={t("accounts.type.other")}
        >
          <Select
            name="type"
            defaultValue="checking"
            onValueChange={setAccountType}
          >
            <SelectTrigger
              id="type"
              className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm"
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
        </OnboardingField>
      </div>

      {/* Credit card specific fields */}
      {accountType === "credit_card" && (
        <div className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/70">
            {t("accounts.credit_card_settings")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">{t("accounts.credit_limit")}</Label>
              <MoneyInput
                id="creditLimit"
                name="creditLimit"
                defaultValue={0}
                className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statementDay">{t("accounts.statement_day")}</Label>
              <Input
                id="statementDay"
                name="statementDay"
                type="number"
                min="1"
                max="31"
                defaultValue="25"
                placeholder="25"
                className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedBankAccountId">
              {t("accounts.linked_bank_account")}
            </Label>
            <Select name="linkedBankAccountId">
              <SelectTrigger id="linkedBankAccountId" className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm">
                <SelectValue placeholder={t("accounts.select_payment_account")} />
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

      <div className="space-y-2">
        <Label htmlFor="openingBalance">{t("accounts.opening_balance")}</Label>
        <MoneyInput
          id="openingBalance"
          name="openingBalance"
          defaultValue={0}
          className="h-11 rounded-xl border-border bg-background px-4 text-base shadow-sm"
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
        This account will be included in your household balance and cash-flow calculations right away.
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full">
        {isPending ? t("accounts.saving") : t("accounts.create")}
      </Button>

      <OnboardingStatusMessage state={state} />
    </form>
  );
}
