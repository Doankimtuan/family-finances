"use client";

import { useTransition, useState, useMemo } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
import { SegmentedControl } from "@/components/ui/segmented-control";
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
  const [state, setState] = useState<TransactionActionState>(
    initialTransactionActionState,
  );
  const [isPending, startTransition] = useTransition();
  const quickAddModeLabel =
    language === "vi" ? "Chế độ nhập nhanh" : "Quick add mode";

  const methods = useForm<QuickAddValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      type: "expense",
      accountId,
      categoryId: categories[0]?.id ?? "",
      amount: 0,
    },
  });

  const { handleSubmit, setValue, reset, control } = methods;
  const type = useWatch({ control, name: "type" });
  const activeCategoryId = useWatch({ control, name: "categoryId" });
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
      <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
        <SegmentedControl
          ariaLabel={quickAddModeLabel}
          value={type}
          onValueChange={(nextType) =>
            setValue("type", nextType as "income" | "expense")
          }
          options={[
            { value: "expense", label: t("activity.quick_add.expense") },
            { value: "income", label: t("activity.quick_add.income") },
          ]}
        />

        <RHFMoneyInput
          name="amount"
          label={t("activity.quick_add.amount")}
          className="w-full rounded-2xl border-2 border-border/70 bg-background text-2xl font-bold tracking-tight shadow-sm transition-colors focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10 sm:text-3xl"
          autoFocus
          placeholder="0"
        />

        {!isIncomeMode ? (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">
              {t("activity.quick_add.category")}
            </p>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1 pb-1">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("categoryId", category.id)}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      activeCategoryId === category.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "border-border bg-background/50 text-muted-foreground hover:border-border/80 hover:bg-background hover:text-foreground",
                    )}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("activity.quick_add.no_category")}
              </p>
            )}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isPending || (!isIncomeMode && !activeCategoryId)}
          className="w-full rounded-2xl text-base font-semibold shadow-lg transition-transform active:scale-[0.98]"
        >
          {isPending
            ? t("common.saving")
            : isIncomeMode
              ? t("activity.quick_add.submit.income")
              : t("activity.quick_add.submit.expense")}
        </Button>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium leading-relaxed text-primary/80">
            {helperText}
          </p>
        </div>

        {state.spendingJarWarning ? (
          <Alert
            variant={
              state.spendingJarWarning.alertLevel === "exceeded"
                ? "destructive"
                : "warning"
            }
            className="rounded-2xl"
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
