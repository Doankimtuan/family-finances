"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteAssetAction } from "@/app/assets/actions";
import { initialAssetActionState, type AssetActionState } from "@/app/assets/action-types";

type Props = {
  assetId: string;
  language: "en" | "vi";
};

export function DeleteAssetButton({ assetId, language }: Props) {
  const vi = language === "vi";
  const router = useRouter();
  const [state, action] = useActionState<AssetActionState, FormData>(
    deleteAssetAction,
    initialAssetActionState,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      router.push("/assets");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      noValidate
      className="space-y-1"
      onSubmit={(event) => {
        event.preventDefault();
        if (!window.confirm(vi ? "Xóa tài sản này? Hành động này không thể hoàn tác." : "Delete this asset? This action cannot be undone.")) return;
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="assetId" value={assetId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang xóa..." : "Deleting...") : (vi ? "Xóa tài sản" : "Delete Asset")}
      </button>
      {state.status === "error" && state.message ? <p className="text-xs text-rose-600">{state.message}</p> : null}
    </form>
  );
}
