"use client";

import { useActionState, useTransition } from "react";

import { updateProfileAction } from "@/app/settings/actions";
import { initialSettingsActionState, type SettingsActionState } from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";

export function ProfileForm({
  defaultFullName,
  defaultEmail,
  defaultAvatarUrl,
}: {
  defaultFullName: string;
  defaultEmail: string;
  defaultAvatarUrl: string;
}) {
  const { language, t } = useI18n();
  const vi = language === "vi";
  const [state, action] = useActionState<SettingsActionState, FormData>(
    updateProfileAction,
    initialSettingsActionState,
  );
  const [isPending, startTransition] = useTransition();

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
        <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
          {vi ? "Họ và tên" : "Full name"}
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          defaultValue={defaultFullName}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          {vi ? "Email" : "Email"}
        </label>
        <input
          id="email"
          value={defaultEmail}
          readOnly
          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-base text-slate-600"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="avatarUrl" className="text-sm font-medium text-slate-700">
          {vi ? "URL ảnh đại diện (không bắt buộc)" : "Avatar URL (optional)"}
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={defaultAvatarUrl}
          placeholder={vi ? "https://example.com/avatar.jpg" : "https://example.com/avatar.jpg"}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? t("common.saving") : (vi ? "Lưu hồ sơ" : "Save Profile")}
      </button>

      {state.status === "error" && state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
      {state.status === "success" && state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
    </form>
  );
}
