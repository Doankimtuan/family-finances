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

import dynamic from "next/dynamic";

const JarCreateForm = dynamic(
  () => import("./jar-create-form").then((m) => m.JarCreateForm),
  { ssr: false }
);

export function JarCreateDialog({ vi }: { vi: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          {vi ? "Tạo hũ mới" : "Create jar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{vi ? "Tạo hũ mới" : "Create new jar"}</DialogTitle>
          <DialogDescription>
            {vi
              ? "Dùng cho các nhóm mục tiêu hoặc thói quen chi tiêu bạn muốn theo dõi riêng."
              : "Use this for goals or spending buckets you want to track separately."}
          </DialogDescription>
        </DialogHeader>
        <JarCreateForm vi={vi} />
      </DialogContent>
    </Dialog>
  );
}
