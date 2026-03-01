"use client";

import { useActionState, useTransition } from "react";

import { updateHouseholdSettingsAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function HouseholdSettingsForm({
  defaultName,
  defaultTimezone,
  defaultLanguage,
}: {
  defaultName: string;
  defaultTimezone: string;
  defaultLanguage: "en" | "vi";
}) {
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateHouseholdSettingsAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {t("settings.household_name")}
        </Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          defaultValue={defaultName}
          className="rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="language"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            {t("settings.language")}
          </Label>
          <Select name="language" defaultValue={defaultLanguage}>
            <SelectTrigger
              id="language"
              className="w-full rounded-xl border border-input bg-background h-12"
            >
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("settings.lang_en")}</SelectItem>
              <SelectItem value="vi">{t("settings.lang_vi")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="timezone"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            {t("settings.timezone")}
          </Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={defaultTimezone}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground font-medium leading-relaxed">
        {t("settings.base_currency_note")}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl py-6 text-sm font-bold tracking-wide"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("common.saving")}
          </>
        ) : (
          t("settings.save_household")
        )}
      </Button>

      {state.status === "error" && state.message && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20 px-4 py-3 text-rose-800 dark:text-rose-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}

      {state.status === "success" && state.message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20 px-4 py-3 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}
    </form>
  );
}
