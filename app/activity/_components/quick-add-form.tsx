"use client";

import { useTransition, useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { quickAddTransactionAction } from "@/app/activity/actions";
import {
  initialTransactionActionState,
  type TransactionActionState,
} from "@/app/activity/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { RHFMoneyInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

const quickAddSchema = z.object({
  type: z.enum(["income", "expense"]),
  accountId: z.string(),
  categoryId: z.string().optional(),
  amount: z.number().min(1, "activity.error.amount_required"),
});

type QuickAddValues = z.infer<typeof quickAddSchema>;

type QuickCategory = {
  id: string;
  name: string;
};

type QuickAddFormProps = {
  accountId: string;
  categories: QuickCategory[];
};

export function QuickAddForm({ accountId, categories }: QuickAddFormProps) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, setState] = useState<TransactionActionState>(initialTransactionActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<QuickAddValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      type: "expense",
      accountId,
      categoryId: categories[0]?.id ?? "",
      amount: 0,
    },
  });

  const { handleSubmit, setValue, watch, reset } = methods;
  const type = watch("type");
  const activeCategoryId = watch("categoryId");
  const isIncomeMode = type === "income";

  const helperText = useMemo(() => {
    if (isIncomeMode) {
      return t("activity.quick_add.helper.income");
    }

    return t("activity.quick_add.helper.expense");
  }, [isIncomeMode, t]);

  const onSubmit = async (data: QuickAddValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await quickAddTransactionAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
        reset({
          ...data,
          amount: 0,
        });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-3"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue("type", "expense")}
            className={cn(
              "rounded-lg transition-all",
              !isIncomeMode
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            )}
          >
            {t("activity.quick_add.expense")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue("type", "income")}
            className={cn(
              "rounded-lg transition-all",
              isIncomeMode
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50"
            )}
          >
            {t("activity.quick_add.income")}
          </Button>
        </div>

        <RHFMoneyInput
          name="amount"
          label={t("activity.quick_add.amount")}
          className="w-full text-xl font-semibold"
          autoFocus
          placeholder="0"
        />

        {!isIncomeMode ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {t("activity.quick_add.category")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("categoryId", category.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 transition",
                    activeCategoryId === category.id
                      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isPending || (!isIncomeMode && !activeCategoryId)}
          className="w-full rounded-xl bg-slate-900"
        >
          {isPending
            ? t("common.saving")
            : isIncomeMode
              ? t("activity.quick_add.submit.income")
              : t("activity.quick_add.submit.expense")}
        </Button>

        <p className="text-xs text-slate-500">{helperText}</p>

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
                ? t("activity.alert.jar_exceeded")
                : t("activity.alert.jar_warning")}
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
