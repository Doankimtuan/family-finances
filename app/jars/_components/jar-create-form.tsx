"use client";

import { useActionState, useTransition } from "react";

import { createJarAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";

export function JarCreateForm({ vi }: { vi: boolean }) {
  const [state, action] = useActionState<JarActionState, FormData>(
    createJarAction,
    initialJarActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-2 md:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input
        name="name"
        placeholder={vi ? "Tên hũ" : "Jar name"}
        className="rounded-lg border px-2 py-2 text-sm"
        required
      />
      <input
        name="color"
        placeholder={vi ? "Màu (#2563EB)" : "Color (#2563EB)"}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      <input
        name="icon"
        placeholder={vi ? "Icon (house)" : "Icon (house)"}
        className="rounded-lg border px-2 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang tạo..." : "Creating...") : vi ? "Tạo hũ" : "Create jar"}
      </button>
      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
