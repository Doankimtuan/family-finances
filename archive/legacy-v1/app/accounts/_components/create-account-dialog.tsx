"use client";

import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        {t("common.add")}
      </Button>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              {t("money.accounts.new_account")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("money.accounts.create_description")}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[calc(85vh-104px)] overflow-y-auto px-6 py-6 pb-24">
          <CreateAccountForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const CreateAccountDialog = memo(CreateAccountDialogComponent);
