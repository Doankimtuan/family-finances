"use client";

import { useActionState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { createAccountAction } from "@/app/money/actions";
import {
  initialAccountActionState,
  type AccountActionState,
} from "@/app/money/action-types";
import { MoneyInput } from "@/components/ui/money-input";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateAccountForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<AccountActionState, FormData>(
    createAccountAction,
    initialAccountActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

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
        <Select name="type" defaultValue="checking">
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
            <SelectItem value="other">{t("accounts.type.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="openingBalance">{t("accounts.opening_balance")}</Label>
        <MoneyInput
          id="openingBalance"
          name="openingBalance"
          defaultValue={0}
          className="w-full"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full rounded-xl">
        {isPending ? t("accounts.saving") : t("accounts.create")}
      </Button>
    </form>
  );
}
