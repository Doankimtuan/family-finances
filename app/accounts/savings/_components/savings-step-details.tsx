import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { FormSection } from "./form-ui";
import { RHFInput, RHFMoneyInput, RHFSelect } from "@/components/ui/rhf-fields";
import type { AccountOption, GoalOption, JarOption } from "../_lib/form-types";
import type { SavingsFormValues } from "../_lib/form-schema";

type Props = {
  accounts: AccountOption[];
  goals: GoalOption[];
  jars: JarOption[];
  toggleLinkedAccount: (accountId: string) => void;
  onBack: () => void;
  onNext: () => Promise<void>;
};

export function SavingsStepDetails({
  accounts,
  goals,
  jars,
  toggleLinkedAccount,
  onBack,
  onNext,
}: Props) {
  const { t } = useI18n();
  const { watch } = useFormContext<SavingsFormValues>();
  const form = watch();

  const fieldClassName =
    "h-12 border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary/20";
  const selectClassName =
    "h-12 border-slate-300 bg-white text-slate-950 data-[placeholder]:text-slate-400";

  return (
    <div className="space-y-4">
      <FormSection title={t("savings.form.section.basics")}>
        <div className="grid gap-4 md:grid-cols-2">
          <RHFInput
            name="providerName"
            label={t("savings.form.field.provider")}
            placeholder={t("savings.form.placeholder.provider")}
            className={fieldClassName}
          />
          <RHFInput
            name="productName"
            label={t("savings.form.field.product_name")}
            placeholder={t("savings.form.placeholder.product_name")}
            className={fieldClassName}
          />
          <RHFMoneyInput
            name="principalAmount"
            label={t("savings.form.field.principal")}
            className={fieldClassName}
          />
          <RHFInput
            name="annualRate"
            label={t("savings.form.field.annual_rate")}
            description={t("savings.form.helper.rate_decimal")}
            type="number"
            min="0"
            step="0.0001"
            className={fieldClassName}
          />
          <RHFInput
            name="startDate"
            label={t("savings.form.field.start_date")}
            type="date"
            className={fieldClassName}
          />
          <RHFSelect
            name="primaryLinkedAccountId"
            label={t("savings.form.field.primary_account")}
            placeholder={t("savings.form.validation.select_account")}
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            className={selectClassName}
          />
        </div>
      </FormSection>

      <FormSection title={t("savings.form.section.plan")}>
        {form.savingsType === "bank" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <RHFInput
              name="termDays"
              label={t("savings.form.field.term_days")}
              type="number"
              min="1"
              className={fieldClassName}
            />
            <RHFInput
              name="earlyWithdrawalRate"
              label={t("savings.form.field.early_rate")}
              description={t("savings.form.helper.rate_decimal")}
              type="number"
              min="0"
              step="0.0001"
              className={fieldClassName}
            />
            <RHFSelect
              name="maturityPreference"
              label={t("savings.form.field.maturity_preference")}
              options={[
                { label: t("savings.form.option.maturity.renew_same"), value: "renew_same" },
                { label: t("savings.form.option.maturity.withdraw"), value: "withdraw" },
              ]}
              className={selectClassName}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <RHFSelect
                name="interestType"
                label={t("savings.form.field.interest_type")}
                options={[
                  { label: t("savings.form.option.interest.simple"), value: "simple" },
                  { label: t("savings.form.option.interest.compound"), value: "compound_daily" },
                ]}
                className={selectClassName}
              />
              <RHFSelect
                name="termMode"
                label={t("savings.form.field.term_mode")}
                options={[
                  { label: t("savings.form.option.term.fixed"), value: "fixed" },
                  { label: t("savings.form.option.term.flexible"), value: "flexible" },
                ]}
                className={selectClassName}
              />
              <RHFInput
                name="taxRate"
                label={t("savings.form.field.tax_rate")}
                description={t("savings.form.helper.tax_decimal")}
                type="number"
                min="0"
                step="0.0001"
                className={fieldClassName}
              />
            </div>

            {form.termMode === "fixed" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <RHFInput
                  name="termDays"
                  label={t("savings.form.field.term_days")}
                  type="number"
                  min="1"
                  className={fieldClassName}
                />
                <RHFSelect
                  name="maturityPreference"
                  label={t("savings.form.field.maturity_preference")}
                  options={[
                    { label: t("savings.form.option.maturity.renew_same"), value: "renew_same" },
                    { label: t("savings.form.option.maturity.switch_plan"), value: "switch_plan" },
                    { label: t("savings.form.option.maturity.withdraw"), value: "withdraw" },
                  ]}
                  className={selectClassName}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950">
                {t("savings.form.helper.flexible")}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">
                {t("savings.form.field.linked_accounts")}
              </label>
              <div className="flex flex-wrap gap-2">
                {accounts.map((account) => {
                  const selected = form.linkedAccountIds.includes(account.id);
                  return (
                    <Button
                      key={account.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLinkedAccount(account.id)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm transition h-auto",
                        selected
                          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/15 hover:bg-primary/20"
                          : "border-slate-300 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50",
                      )}
                    >
                      {account.name}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-600">
                {t("savings.form.helper.linked_accounts")}
              </p>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title={t("savings.form.section.optional")}>
        <div className="grid gap-4 md:grid-cols-2">
          <RHFSelect
            name="sourceJarId"
            label={t("savings.form.field.source_jar")}
            placeholder={t("savings.form.placeholder.review_later")}
            options={[
              { label: t("savings.form.placeholder.review_later"), value: "__none__" },
              ...jars.map((j) => ({ label: j.name, value: j.id })),
            ]}
            className={selectClassName}
          />
          <RHFSelect
            name="goalId"
            label={t("savings.form.field.goal")}
            placeholder={t("savings.form.option.goal.none")}
            options={[
              { label: t("savings.form.option.goal.none"), value: "__none__" },
              ...goals.map((g) => ({ label: g.name, value: g.id })),
            ]}
            className={selectClassName}
          />
          <RHFInput
            name="notes"
            label={t("savings.form.field.notes")}
            placeholder={t("savings.form.placeholder.notes")}
            className={fieldClassName}
          />
        </div>
      </FormSection>

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
          onClick={onNext}
          className="flex-1"
        >
          {t("savings.form.action.review")}
        </Button>
      </div>
    </div>
  );
}
