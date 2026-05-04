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

const JarTargetForm = dynamic(
  () => import("./jar-target-form").then((m) => m.JarTargetForm),
  { ssr: false }
);

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  jarId: string;
  jarName: string;
  month: string;
  defaultMode: "fixed" | "percent";
  defaultValue: number;
};

export function JarTargetDialog({
  jarId,
  jarName,
  month,
  defaultMode,
  defaultValue,
}: Props) {
  const { t } = useI18n();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          {t("jars.action.set_target")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{t("jars.target.title")}</DialogTitle>
          <DialogDescription>
            {t("jars.target.description", { name: jarName })}
          </DialogDescription>
        </DialogHeader>
        <JarTargetForm
          jarId={jarId}
          month={month}
          defaultMode={defaultMode}
          defaultValue={defaultValue}
        />
      </DialogContent>
    </Dialog>
  );
}
