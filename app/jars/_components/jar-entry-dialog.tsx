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

const JarAllocateWithdrawForm = dynamic(
  () =>
    import("./jar-allocate-withdraw-form").then(
      (m) => m.JarAllocateWithdrawForm,
    ),
  { ssr: false },
);

import { useI18n } from "@/lib/providers/i18n-provider";

import type { AppLanguage } from "@/lib/i18n/config";

type Props = {
  jarId: string;
  jarName: string;
  month: string;
  language: AppLanguage;
};

export function JarEntryDialog({ jarId, jarName, month, language }: Props) {
  const { t } = useI18n();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl">
          {t("jars.action.allocate_withdraw")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{t("jars.entry.title")}</DialogTitle>
          <DialogDescription>
            {t("jars.entry.description", { name: jarName })}
          </DialogDescription>
        </DialogHeader>
        <JarAllocateWithdrawForm
          jarId={jarId}
          month={month}
          language={language}
        />
      </DialogContent>
    </Dialog>
  );
}
