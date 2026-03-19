"use client";

import { useActionState, useTransition } from "react";

import { updateJarAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="jarId" value={jarId} />
      <div className="space-y-1.5">
        <Label htmlFor={`jar-edit-name-${jarId}`}>{vi ? "Tên hũ" : "Jar name"}</Label>
        <Input
          id={`jar-edit-name-${jarId}`}
          name="name"
          defaultValue={defaultName}
          className="h-[50px] rounded-xl border-slate-300"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`jar-edit-color-${jarId}`}>{vi ? "Màu nhận diện" : "Color"}</Label>
          <Input
            id={`jar-edit-color-${jarId}`}
            name="color"
            defaultValue={defaultColor ?? ""}
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`jar-edit-icon-${jarId}`}>{vi ? "Biểu tượng" : "Icon"}</Label>
          <Input
            id={`jar-edit-icon-${jarId}`}
            name="icon"
            defaultValue={defaultIcon ?? ""}
            className="h-[50px] rounded-xl border-slate-300"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-11 rounded-xl bg-muted px-4 text-sm font-semibold"
      >
        {isPending ? (vi ? "Đang cập nhật..." : "Updating...") : vi ? "Cập nhật hũ" : "Update jar"}
      </button>
      <p className="text-xs text-muted-foreground">
        {state.status === "error" ? state.message : state.status === "success" ? state.message : ""}
      </p>
    </form>
  );
}
