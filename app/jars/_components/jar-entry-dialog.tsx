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

import { JarAllocateWithdrawForm } from "./jar-allocate-withdraw-form";

type Props = {
  jarId: string;
  jarName: string;
  month: string;
  vi: boolean;
};

export function JarEntryDialog({ jarId, jarName, month, vi }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl">
          {vi ? "Phân bổ / Rút" : "Allocate / Withdraw"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{vi ? "Ghi nhận giao dịch hũ" : "Record jar entry"}</DialogTitle>
          <DialogDescription>
            {vi
              ? `Thêm phân bổ, rút hoặc điều chỉnh cho hũ ${jarName}.`
              : `Add an allocation, withdrawal, or adjustment for ${jarName}.`}
          </DialogDescription>
        </DialogHeader>
        <JarAllocateWithdrawForm jarId={jarId} month={month} vi={vi} />
      </DialogContent>
    </Dialog>
  );
}
