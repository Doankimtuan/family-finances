"use client";

import { useTransition, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { updateJarAction } from "@/app/jars/actions";
import {
  initialJarActionState,
  type JarActionState,
} from "@/app/jars/action-types";
import { RHFInput } from "@/components/ui/rhf-fields";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { toast } from "sonner";

const editJarSchema = z.object({
  jarId: z.string().min(1),
  name: z.string().min(1, "Jar name is required"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type EditJarValues = z.infer<typeof editJarSchema>;

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
  const [state, setState] = useState<JarActionState>(initialJarActionState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<EditJarValues>({
    resolver: zodResolver(editJarSchema),
    defaultValues: {
      jarId,
      name: defaultName,
      color: defaultColor ?? "",
      icon: defaultIcon ?? "",
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data: EditJarValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await updateJarAction(state, formData);
      setState(result);
      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type="hidden" {...methods.register("jarId")} />
        
        <RHFInput
          name="name"
          label={vi ? "Tên hũ" : "Jar name"}
          placeholder={vi ? "Ví dụ: Du lịch, Quà tặng..." : "e.g. Travel, Gifts..."}
          required
        />
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RHFInput
            name="color"
            label={vi ? "Màu nhận diện" : "Color"}
            placeholder={vi ? "VD: #2563EB" : "e.g. #2563EB"}
          />
          <RHFInput
            name="icon"
            label={vi ? "Biểu tượng" : "Icon"}
            placeholder="house"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          variant="outline"
          className="w-full rounded-xl"
        >
          {isPending ? (vi ? "Đang cập nhật..." : "Updating...") : vi ? "Cập nhật hũ" : "Update jar"}
        </Button>

        <FormStatus message={state.message} status={state.status} />
      </form>
    </FormProvider>
  );
}
