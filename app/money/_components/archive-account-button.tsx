"use client";

import { useActionState, useTransition } from "react";

import { archiveAccountAction } from "@/app/money/actions";
import {
  initialAccountActionState,
  type AccountActionState,
} from "@/app/money/action-types";

export function ArchiveAccountButton({ accountId }: { accountId: string }) {
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
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
      >
        {isPending ? "Archiving..." : "Archive"}
      </button>
      {state.status === "error" && state.message ? (
        <p className="text-xs text-rose-600">{state.message}</p>
      ) : null}
    </form>
  );
}
