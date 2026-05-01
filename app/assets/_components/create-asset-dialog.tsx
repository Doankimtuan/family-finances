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
import { Button } from "@/components/ui/button";
import { CreateAssetForm } from "@/app/assets/_components/create-asset-form";
import { useI18n } from "@/lib/providers/i18n-provider";

export function CreateAssetDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors h-auto p-0"
        >
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("assets.create")}
          </DialogTitle>
        </DialogHeader>
        <CreateAssetForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
