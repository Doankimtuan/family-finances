"use client";

import { useActionState, useTransition } from "react";

import { updateProfileAction } from "@/app/settings/actions";
import {
  initialSettingsActionState,
  type SettingsActionState,
} from "@/app/settings/action-types";
import { useI18n } from "@/lib/providers/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ProfileForm({
  defaultFullName,
  defaultEmail,
}: {
  defaultFullName: string;
  defaultEmail: string;
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
          htmlFor="fullName"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {vi ? "Họ và tên" : "Full name"}
        </Label>
        <Input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          defaultValue={defaultFullName}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {vi ? "Email" : "Email"}
        </Label>
        <Input
          id="email"
          value={defaultEmail}
          readOnly
          disabled
          className="rounded-xl bg-muted/50 text-muted-foreground italic border-dashed"
        />
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
        ) : vi ? (
          "Cập nhật hồ sơ"
        ) : (
          "Update Profile"
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
