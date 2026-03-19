"use client";

import { useActionState, useTransition } from "react";

import { createJarAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JarCreateForm({ vi }: { vi: boolean }) {
  const [state, action] = useActionState<JarActionState, FormData>(
    createJarAction,
    initialJarActionState,
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="jar-name">{vi ? "Tên hũ" : "Jar name"}</Label>
        <Input
          id="jar-name"
          name="name"
          placeholder={vi ? "Ví dụ: Du lịch, Quà tặng..." : "e.g. Travel, Gifts..."}
          className="h-[50px] rounded-xl border-slate-300"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jar-color">{vi ? "Màu nhận diện" : "Color"}</Label>
          <Input
            id="jar-color"
            name="color"
            placeholder={vi ? "VD: #2563EB" : "e.g. #2563EB"}
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jar-icon">{vi ? "Biểu tượng" : "Icon"}</Label>
          <Input
            id="jar-icon"
            name="icon"
            placeholder="house"
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? (vi ? "Đang tạo..." : "Creating...") : vi ? "Tạo hũ" : "Create jar"}
      </button>
      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
