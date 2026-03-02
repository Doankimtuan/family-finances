"use client";

import { useActionState, useTransition } from "react";

import { updateJarAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";

type Props = {
  jarId: string;
  defaultName: string;
  defaultColor: string | null;
  defaultIcon: string | null;
  vi: boolean;
};

export function JarEditForm({
  jarId,
  defaultName,
  defaultColor,
  defaultIcon,
  vi,
}: Props) {
  const [state, action] = useActionState<JarActionState, FormData>(
    updateJarAction,
    initialJarActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-2 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="jarId" value={jarId} />
      <input
        name="name"
        defaultValue={defaultName}
        className="rounded-lg border px-2 py-2 text-sm"
        required
      />
      <input
        name="color"
        defaultValue={defaultColor ?? ""}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      <input
        name="icon"
        defaultValue={defaultIcon ?? ""}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold"
      >
        {isPending ? (vi ? "Đang cập nhật..." : "Updating...") : vi ? "Cập nhật hũ" : "Update jar"}
      </button>
      <p className="text-xs text-muted-foreground md:col-span-4">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
