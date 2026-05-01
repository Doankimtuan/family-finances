"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { useI18n } from "@/lib/providers/i18n-provider";

export function CreateAssetDialog() {
  const { language } = useI18n();
  const vi = language === "vi";
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {vi ? "Thêm" : "Add"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vi ? "Tài sản mới" : "New Asset"}
          </DialogTitle>
        </DialogHeader>
        <CreateAssetForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
