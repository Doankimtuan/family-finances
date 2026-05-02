import { Button } from "@/components/ui/button";
import { Landmark, Sparkles, WalletCards } from "lucide-react";
import { useI18n } from "@/lib/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import type { SavingsFormValues } from "../_lib/form-schema";

type Props = {
  onNext: () => void;
};

export function SavingsStepType({ onNext }: Props) {
  const { t } = useI18n();
  const { watch, setValue } = useFormContext<SavingsFormValues>();
  const savingsType = watch("savingsType");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "rounded-2xl border p-5 text-left transition h-auto justify-start block",
            savingsType === "bank"
              ? "border-primary bg-blue-50 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
              : "border-slate-200 bg-white hover:border-primary/40 hover:bg-white",
          )}
          onClick={() => {
            setValue("savingsType", "bank", { shouldValidate: true });
            setValue("interestType", "simple");
            setValue("termMode", "fixed");
          }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {t("savings.form.type.bank.title")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("savings.form.type.bank.description")}
              </p>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className={cn(
            "rounded-2xl border p-5 text-left transition h-auto justify-start block",
            savingsType === "third_party"
              ? "border-primary bg-emerald-50 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
              : "border-slate-200 bg-white hover:border-primary/40 hover:bg-white",
          )}
          onClick={() => setValue("savingsType", "third_party", { shouldValidate: true })}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {t("savings.form.type.third_party.title")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("savings.form.type.third_party.description")}
              </p>
            </div>
          </div>
        </Button>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {savingsType === "bank"
              ? t("savings.form.type.bank.description")
              : t("savings.form.type.third_party.description")}
          </p>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={onNext}>
        {t("savings.form.action.continue")}
      </Button>
    </div>
  );
}
