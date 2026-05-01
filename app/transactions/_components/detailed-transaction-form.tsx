"use client";

import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/transactions/action-types";
import { addTransactionDetailedAction } from "@/app/transactions/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  accountId: z.string().min(1, "Account is required"),
  counterpartyAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  transactionDate: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type TransactionValues = z.infer<typeof transactionSchema>;

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type DetailedTransactionFormProps = {
  accounts: AccountOption[];
  categories: CategoryOption[];
};

export function DetailedTransactionForm({
  accounts,
  categories,
}: DetailedTransactionFormProps) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<TransactionActionState>(
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();

  const methods = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      accountId: "",
      counterpartyAccountId: "",
      categoryId: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      description: "",
    },
  });

  const { handleSubmit, setValue, watch, reset } = methods;
  const type = watch("type");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  const onSubmit = async (data: TransactionValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await addTransactionDetailedAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        reset({
          ...data,
          amount: 0,
          description: "",
        });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form className="space-y-3" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue("type", "expense")}
            className={cn(
              "rounded-lg transition-all",
              type === "expense"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50",
            )}
          >
            {vi ? "Chi tiêu" : "Expense"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue("type", "income")}
            className={cn(
              "rounded-lg transition-all",
              type === "income"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50",
            )}
          >
            {vi ? "Thu nhập" : "Income"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue("type", "transfer")}
            className={cn(
              "rounded-lg transition-all",
              type === "transfer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50",
            )}
          >
            {vi ? "Chuyển khoản" : "Transfer"}
          </Button>
        </div>

        <RHFMoneyInput
          name="amount"
          label={vi ? "Số tiền (VND)" : "Amount (VND)"}
          className="w-full"
          autoFocus
        />

        <RHFSelect
          name="accountId"
          label={
            type === "transfer"
              ? vi
                ? "Từ tài khoản"
                : "From Account"
              : vi
                ? "Tài khoản"
                : "Account"
          }
          required
          options={accounts.map((acc) => ({ label: acc.name, value: acc.id }))}
          placeholder={vi ? "Chọn tài khoản" : "Select account"}
        />

        {type === "transfer" ? (
          <RHFSelect
            name="counterpartyAccountId"
            label={vi ? "Đến tài khoản" : "To Account"}
            required
            options={accounts.map((acc) => ({
              label: acc.name,
              value: acc.id,
            }))}
            placeholder={
              vi ? "Chọn tài khoản đích" : "Select destination account"
            }
          />
        ) : (
          <RHFSelect
            name="categoryId"
            label={vi ? "Danh mục" : "Category"}
            required={type === "expense"}
            options={filteredCategories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
            placeholder={
              filteredCategories.length === 0
                ? vi
                  ? "Không có danh mục"
                  : "No category"
                : vi
                  ? "Chọn danh mục"
                  : "Select category"
            }
          />
        )}

        <RHFInput
          name="transactionDate"
          label={vi ? "Ngày" : "Date"}
          type="date"
          required
        />

        <RHFInput
          name="description"
          label={vi ? "Mô tả" : "Description"}
          placeholder={vi ? "Ghi chú (không bắt buộc)" : "Optional note"}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-slate-900"
        >
          {isPending
            ? vi
              ? "Đang lưu..."
              : "Saving..."
            : vi
              ? "Lưu giao dịch"
              : "Save Transaction"}
        </Button>

        {state.spendingJarWarning ? (
          <Alert
            variant={
              state.spendingJarWarning.alertLevel === "exceeded"
                ? "destructive"
                : "warning"
            }
          >
            <AlertTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {state.spendingJarWarning.alertLevel === "exceeded"
                ? vi
                  ? "Hũ đã vượt hạn mức tháng"
                  : "Jar monthly limit exceeded"
                : vi
                  ? "Hũ đang gần chạm hạn mức"
                  : "Jar is close to monthly limit"}
            </AlertTitle>
            <AlertDescription>
              {state.spendingJarWarning.jarName}:{" "}
              {state.spendingJarWarning.spent.toLocaleString()} /{" "}
              {state.spendingJarWarning.limit.toLocaleString()} VND
              {state.spendingJarWarning.usagePercent !== null
                ? ` (${state.spendingJarWarning.usagePercent.toFixed(1)}%)`
                : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
