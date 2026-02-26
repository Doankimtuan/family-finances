"use client";

import { useActionState, useTransition } from "react";

import { initialSettingsActionState, type SettingsActionState } from "@/app/settings/action-types";
import { updateLanguagePreferenceAction } from "@/app/settings/actions";
import { useI18n } from "@/lib/providers/i18n-provider";

export function LanguageSwitcher({ defaultLanguage }: { defaultLanguage: "en" | "vi" }) {
  const { t, language } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateLanguagePreferenceAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <label htmlFor="quick-language" className="text-sm font-medium text-slate-700">
        {t("settings.language")}
      </label>
      <div className="flex items-center gap-2">
        <select
          id="quick-language"
          name="language"
          defaultValue={defaultLanguage}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
        >
          <option value="en">{t("settings.lang_en")}</option>
          <option value="vi">{t("settings.lang_vi")}</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? t("common.saving") : vi ? "Áp dụng" : "Apply"}
        </button>
      </div>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
