"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/providers/i18n-provider";

import { JarFundingForm } from "./jar-funding-form";

type JarFundingDialogProps = {
  jars: { id: string; name: string }[];
  assets: { id: string; name: string; type: "asset" | "account" }[];
  returnTo: string;
};

export function JarFundingDialog({ jars, assets, returnTo }: JarFundingDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (jars.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          {t("jars.action.fund_jar")}
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("jars.funding.title")}</DialogTitle>
          <DialogDescription>{t("jars.funding.description")}</DialogDescription>
        </DialogHeader>
        {assets.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-600">
            {t("jars.funding.no_assets")}
          </div>
        ) : (
          <JarFundingForm
            jars={jars}
            assets={assets}
            returnTo={returnTo}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
