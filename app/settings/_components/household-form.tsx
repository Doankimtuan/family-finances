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
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          {t("settings.household_name")}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          defaultValue={defaultName}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="language"
            className="text-sm font-medium text-slate-700"
          >
            {t("settings.language")}
          </label>
          <Select name="language" defaultValue={defaultLanguage}>
            <SelectTrigger
              id="language"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-6 text-base text-slate-900"
            >
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("settings.lang_en")}</SelectItem>
              <SelectItem value="vi">{t("settings.lang_vi")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="timezone"
            className="text-sm font-medium text-slate-700"
          >
            {t("settings.timezone")}
          </label>
          <input
            id="timezone"
            name="timezone"
            defaultValue={defaultTimezone}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {t("settings.base_currency_note")}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? t("common.saving") : t("settings.save_household")}
      </button>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-rose-600">{state.message}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}
