"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DebtsForm } from "@/app/onboarding/_components/debts-form";
import { useI18n } from "@/lib/providers/i18n-provider";

export function AddDebtDialog() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          {t("common.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              {t("debts.title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("debts.add_description")}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[calc(85vh-104px)] overflow-y-auto px-6 py-6 pb-24">
          <DebtsForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
