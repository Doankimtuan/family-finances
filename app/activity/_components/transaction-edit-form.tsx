"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useI18n } from "@/lib/providers/i18n-provider";
import { RHFInput, RHFSelect } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TransactionType } from "../_constants";

const editTransactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().min(1, "activity.error.amount_required"),
  accountId: z.string().min(1, "activity.error.account_required"),
  counterpartyAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  transactionDate: z.string().min(1, "activity.error.date_required"),
  description: z.string().optional(),
});

type EditTransactionValues = z.infer<typeof editTransactionSchema>;

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };
type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  description: string | null;
  category_id: string | null;
  account_id: string | null;
  counterparty_account_id: string | null;
  transaction_subtype?: string | null;
};

type TransactionEditFormProps = {
  transaction: TransactionItem;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function TransactionEditForm({
  transaction,
  accounts,
  categories,
  onSubmit,
  onCancel,
  isPending,
}: TransactionEditFormProps) {
  const { language, t } = useI18n();
  const typeLabel = language === "vi" ? "Loại giao dịch" : "Transaction type";

  const [type, setType] = useState<TransactionType>(
    (transaction.type === "income" || transaction.type === "transfer"
      ? transaction.type
      : "expense") as TransactionType,
  );

  const methods = useForm<EditTransactionValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      type: transaction.type as "income" | "expense" | "transfer",
      amount: Math.round(transaction.amount),
      accountId: transaction.account_id ?? "",
      counterpartyAccountId: transaction.counterparty_account_id ?? "",
      categoryId: transaction.category_id ?? "",
      transactionDate: transaction.transaction_date.slice(0, 10),
      description: transaction.description ?? "",
    },
  });

  const { handleSubmit, setValue } = methods;

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  const handleFormSubmit = (data: EditTransactionValues) => {
    const formData = new FormData();
    formData.append("transactionId", transaction.id);
    formData.append("type", type);
    formData.append("accountId", data.accountId);
    formData.append("amount", String(data.amount));
    formData.append("transactionDate", data.transactionDate);
    formData.append("description", data.description ?? "");
    
    if (type === "transfer") {
      formData.append("counterpartyAccountId", data.counterpartyAccountId ?? "");
    } else {
      formData.append("categoryId", data.categoryId ?? "");
    }
    
    onSubmit(formData);
  };

  return (
    <FormProvider {...methods}>
      <form className="space-y-4" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
        <input type="hidden" name="transactionId" value={transaction.id} />
        <input type="hidden" name="type" value={type} />

        <SegmentedControl
          ariaLabel={typeLabel}
          value={type}
          onValueChange={(nextType) => {
            setType(nextType as TransactionType);
            setValue("type", nextType as "income" | "expense" | "transfer");
          }}
          options={[
            { value: "expense", label: t("activity.edit.expense") },
            { value: "income", label: t("activity.edit.income") },
            { value: "transfer", label: t("activity.edit.transfer") },
          ]}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFInput
            name="amount"
            label={t("activity.edit.amount")}
            type="number"
            min={1}
            step={1}
            required
            className="rounded-xl border-border/70 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <RHFInput
            name="transactionDate"
            label={t("activity.edit.date")}
            type="date"
            required
            className="rounded-xl border-border/70 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        <RHFSelect
          name="accountId"
          label={t("activity.edit.account")}
          required
          options={accounts.map((acc) => ({ label: acc.name, value: acc.id }))}
          placeholder={t("activity.detailed.select_account")}
          className="rounded-xl border-border/70 bg-background shadow-sm focus:ring-2 focus:ring-primary/20"
        />

        {type === "transfer" ? (
          <RHFSelect
            name="counterpartyAccountId"
            label={t("activity.edit.to_account")}
            required
            options={accounts.map((acc) => ({
              label: acc.name,
              value: acc.id,
            }))}
            placeholder={t("activity.detailed.select_destination_account")}
            className="rounded-xl border-border/70 bg-background shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <RHFSelect
            name="categoryId"
            label={t("activity.edit.category")}
            required={type === "expense"}
            options={filteredCategories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
            placeholder={
              filteredCategories.length === 0
                ? t("activity.quick_add.no_category")
                : t("activity.detailed.select_category")
            }
            className="rounded-xl border-border/70 bg-background shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        )}

        <RHFInput
          name="description"
          label={t("activity.edit.note")}
          placeholder={t("activity.edit.note_placeholder")}
          className="rounded-xl border-border/70 bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl font-semibold shadow-sm transition-transform active:scale-[0.99]"
          >
            {isPending
              ? t("common.saving")
              : t("activity.edit.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl font-semibold"
          >
            {t("activity.edit.cancel")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
