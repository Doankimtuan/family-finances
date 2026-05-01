"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteAssetAction } from "@/app/assets/actions";
import {
  initialAssetActionState,
  type AssetActionState,
} from "@/app/assets/action-types";

import { useI18n } from "@/lib/providers/i18n-provider";
import { Button } from "@/components/ui/button";

type Props = {
  assetId: string;
};

export function DeleteAssetButton({ assetId }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, action] = useActionState<AssetActionState, FormData>(
    deleteAssetAction,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/money");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      noValidate
      className="space-y-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (!window.confirm(t("assets.confirm_delete"))) return;
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="assetId" value={assetId} />
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-60"
      >
        {isPending ? t("common.deleting") : t("assets.delete")}
      </Button>
      {state.status === "error" && state.message ? (
        <p className="text-xs text-rose-600">{state.message}</p>
      ) : null}
    </form>
  );
}
