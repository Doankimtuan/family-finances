import { Button } from "@/components/ui/button";
import { formatPercent, formatVnd } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { AccountOption, GoalOption, JarOption, SavingsFormState, SavingsPreview } from "../_lib/form-types";

type Props = {
  form: SavingsFormState;
  preview: SavingsPreview;
  accounts: AccountOption[];
  goals: GoalOption[];
  jars: JarOption[];
  isPending: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function SavingsStepReview({
  form,
  preview,
  accounts,
  goals,
  jars,
  isPending,
  onBack,
  onConfirm,
}: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
        <p className="text-base font-semibold text-slate-900">
          {form.providerName || t("savings.form.title")}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {t("savings.form.review.description")}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("savings.form.review.principal")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatVnd(Number(form.principalAmount || 0), locale)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("savings.form.review.accrued")}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatVnd(Math.round(preview.accrued), locale)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t("savings.form.review.net")}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {formatVnd(Math.round(preview.net), locale)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white p-4 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-900">
              {t("savings.form.review.rate")}:
            </span>{" "}
            {formatPercent(Number(form.annualRate || 0))}
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-900">
              {t("savings.form.review.start")}:
            </span>{" "}
            {form.startDate}
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-900">
              {t("savings.form.review.maturity")}:
            </span>{" "}
            {form.savingsType === "third_party" && form.termMode === "flexible"
              ? t("savings.form.review.flexible")
              : `${preview.termDays} ${t("savings.card.days")}`}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-slate-50 p-4 text-sm text-slate-600">
          {form.savingsType === "third_party" ? (
            <p>
              <span className="font-medium text-slate-900">
                {t("savings.form.review.tax")}:
              </span>{" "}
              {formatVnd(Math.round(preview.tax), locale)}
            </p>
          ) : null}
          <p className={cn("mt-2", form.savingsType === "bank" && "mt-0")}>
            <span className="font-medium text-slate-900">
              {t("savings.form.field.primary_account")}:
            </span>{" "}
            {accounts.find((account) => account.id === form.primaryLinkedAccountId)
              ?.name ?? "-"}
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-900">{t("savings.form.field.source_jar")}:</span>{" "}
            {form.sourceJarId
              ? jars.find((jar) => jar.id === form.sourceJarId)?.name ?? "-"
              : t("savings.form.placeholder.review_later")}
          </p>
          {form.goalId ? (
            <p className="mt-2">
              <span className="font-medium text-slate-900">
                {t("savings.form.field.goal")}:
              </span>{" "}
              {goals.find((goal) => goal.id === form.goalId)?.name ?? "-"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          {t("savings.form.action.back")}
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="flex-1"
        >
          {isPending
            ? t("savings.form.action.creating")
            : t("savings.form.action.confirm")}
        </Button>
      </div>
    </div>
  );
}
