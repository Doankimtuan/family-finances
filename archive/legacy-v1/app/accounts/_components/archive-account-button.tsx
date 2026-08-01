"use client";

import { useActionState, useTransition } from "react";

import { archiveAccountAction } from "@/app/accounts/actions";
import {
  initialAccountActionState,
  type AccountActionState,
} from "@/app/accounts/action-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";

export function ArchiveAccountButton({
  accountId,
  textWhite,
}: {
  accountId: string;
  textWhite?: boolean;
}) {
  const { t } = useI18n();
  const [state, action] = useActionState<AccountActionState, FormData>(
    archiveAccountAction,
    initialAccountActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-1"
    >
      <input type="hidden" name="accountId" value={accountId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={isPending}
        className={cn(
          "rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-60",
          textWhite
            ? "text-white border-white/20 hover:bg-white/10"
            : "text-slate-700",
        )}
      >
        {isPending ? t("accounts.archiving") : t("accounts.archive")}
      </Button>
      {state.status === "error" && state.message ? (
        <p className="text-xs text-rose-600">{state.message}</p>
      ) : null}
    </form>
  );
}
