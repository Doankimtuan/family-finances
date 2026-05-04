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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { archiveJarDirectAction } from "@/app/jars/actions";
import dynamic from "next/dynamic";

const JarEditForm = dynamic(
  () => import("./jar-edit-form").then((m) => m.JarEditForm),
  { ssr: false }
);

import { useI18n } from "@/lib/providers/i18n-provider";

type Props = {
  jarId: string;
  jarName: string;
  defaultName: string;
  defaultColor: string | null;
  defaultIcon: string | null;
};

export function JarSettingsDialog({
  jarId,
  jarName,
  defaultName,
  defaultColor,
  defaultIcon,
}: Props) {
  const { t } = useI18n();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-xl">
          {t("common.settings")}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{t("jars.settings.title")}</DialogTitle>
          <DialogDescription>
            {t("jars.settings.description", { name: jarName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <JarEditForm
            jarId={jarId}
            defaultName={defaultName}
            defaultColor={defaultColor}
            defaultIcon={defaultIcon}
          />

          <Alert variant="destructive" className="bg-rose-50 border-rose-200">
            <AlertTitle className="text-rose-900 font-semibold">
              {t("jars.settings.archive_title")}
            </AlertTitle>
            <AlertDescription className="text-rose-700">
              {t("jars.settings.archive_description")}
              <form action={archiveJarDirectAction} className="mt-3">
                <input type="hidden" name="jarId" value={jarId} />
                <Button type="submit" variant="destructive" size="sm" className="rounded-xl">
                  {t("jars.action.archive_jar")}
                </Button>
              </form>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
