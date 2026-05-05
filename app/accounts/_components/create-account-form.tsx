"use client";

import { useState, useEffect, memo, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { createAccountAction } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  RHFInput,
  RHFSelect,
  RHFMoneyInput,
} from "@/components/ui/rhf-fields";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_STATEMENT_DAY,
  MIN_STATEMENT_DAY,
  MAX_STATEMENT_DAY,
} from "../_lib/constants";

interface CreateAccountFormData {
  name: string;
  type: string;
  creditLimit: number;
  statementDay: number;
  linkedBankAccountId: string;
  openingBalance: number;
}

const ACCOUNT_TYPES = [
  { value: "checking", labelKey: "accounts.type.checking" },
  { value: "savings", labelKey: "accounts.type.savings" },
  { value: "cash", labelKey: "accounts.type.cash" },
  { value: "ewallet", labelKey: "accounts.type.ewallet" },
  { value: "credit_card", labelKey: "accounts.type.credit_card" },
  { value: "other", labelKey: "accounts.type.other" },
];

function CreateAccountFormComponent() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [accountType, setAccountType] = useState("checking");
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; name: string }[]
  >([]);

  const methods = useForm<CreateAccountFormData>({
    defaultValues: {
      name: "",
      type: "checking",
      creditLimit: 0,
      statementDay: DEFAULT_STATEMENT_DAY,
      linkedBankAccountId: "",
      openingBalance: 0,
    },
  });

  const watchedType = methods.watch("type");

  useEffect(() => {
    setAccountType(watchedType);
    if (watchedType !== "credit_card") return;
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
  }, [watchedType]);

  const onSubmit = (data: CreateAccountFormData) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("type", data.type);
    formData.append("openingBalance", String(data.openingBalance));
    formData.append("creditLimit", String(data.creditLimit));
    formData.append("statementDay", String(data.statementDay));
    formData.append("linkedBankAccountId", data.linkedBankAccountId);

    startTransition(async () => {
      const result = await createAccountAction({ status: "idle", message: "" }, formData);
      if (result.status === "success") {
        toast.success(result.message);
        methods.reset();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  const accountTypeOptions = ACCOUNT_TYPES.map((type) => ({
    label: t(type.labelKey),
    value: type.value,
  }));

  const bankAccountOptions = [
    ...bankAccounts.map((acc) => ({ label: acc.name, value: acc.id })),
    ...(bankAccounts.length === 0
      ? [{ label: t("accounts.no_bank_accounts"), value: "_none" }]
      : []),
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <RHFInput
          name="name"
          label={t("accounts.name")}
          placeholder={t("accounts.placeholder")}
          required
        />

        <RHFSelect
          name="type"
          label={t("accounts.type")}
          options={accountTypeOptions}
        />

        {accountType === "credit_card" && (
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">
              {t("accounts.credit_card_settings")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <RHFMoneyInput
                name="creditLimit"
                label={t("accounts.credit_limit")}
              />
              <RHFInput
                name="statementDay"
                label={t("accounts.statement_day")}
                type="number"
                min={MIN_STATEMENT_DAY}
                max={MAX_STATEMENT_DAY}
              />
            </div>

            <RHFSelect
              name="linkedBankAccountId"
              label={t("accounts.linked_bank_account")}
              options={bankAccountOptions}
            />
          </div>
        )}

        <RHFMoneyInput
          name="openingBalance"
          label={t("accounts.opening_balance")}
        />

        <Button type="submit" disabled={isPending} className="w-full rounded-xl">
          {isPending ? t("accounts.saving") : t("accounts.create")}
        </Button>
      </form>
    </FormProvider>
  );
}

export const CreateAccountForm = memo(CreateAccountFormComponent);
