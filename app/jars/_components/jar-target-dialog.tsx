"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { JarTargetForm } from "./jar-target-form";

type Props = {
  jarId: string;
  jarName: string;
  month: string;
  defaultMode: "fixed" | "percent";
  defaultValue: number;
  vi: boolean;
};

export function JarTargetDialog({
  jarId,
  jarName,
  month,
  defaultMode,
  defaultValue,
  vi,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          {vi ? "Đặt mục tiêu" : "Set target"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{vi ? "Cập nhật mục tiêu tháng" : "Update monthly target"}</DialogTitle>
          <DialogDescription>
            {vi
              ? `Thiết lập mục tiêu cho hũ ${jarName} trong tháng đang xem.`
              : `Set the target for ${jarName} in the selected month.`}
          </DialogDescription>
        </DialogHeader>
        <JarTargetForm
          jarId={jarId}
          month={month}
          defaultMode={defaultMode}
          defaultValue={defaultValue}
          vi={vi}
        />
      </DialogContent>
    </Dialog>
  );
}
