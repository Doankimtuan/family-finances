"use client";

import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, memo } from "react";
import { useI18n } from "@/lib/providers/i18n-provider";

const CreateAccountForm = dynamic(
  () =>
    import("@/app/accounts/_components/create-account-form").then(
      (m) => m.CreateAccountForm
    ),
  { ssr: false }
);

function CreateAccountDialogComponent() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors h-auto p-0"
      >
        <Plus className="h-4 w-4" />
        {t("common.add")}
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            {t("money.accounts.new_account")}
          </DialogTitle>
        </DialogHeader>
        <CreateAccountForm />
      </DialogContent>
    </Dialog>
  );
}

export const CreateAccountDialog = memo(CreateAccountDialogComponent);
