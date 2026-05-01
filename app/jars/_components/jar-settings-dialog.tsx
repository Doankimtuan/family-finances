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

type Props = {
  jarId: string;
  jarName: string;
  defaultName: string;
  defaultColor: string | null;
  defaultIcon: string | null;
  vi: boolean;
};

export function JarSettingsDialog({
  jarId,
  jarName,
  defaultName,
  defaultColor,
  defaultIcon,
  vi,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-xl">
          {vi ? "Thiết lập" : "Settings"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-300 bg-white shadow-2xl sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{vi ? "Thiết lập hũ" : "Jar settings"}</DialogTitle>
          <DialogDescription>
            {vi
              ? `Đổi tên, màu hoặc biểu tượng cho hũ ${jarName}.`
              : `Update the name, color, or icon for ${jarName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <JarEditForm
            jarId={jarId}
            defaultName={defaultName}
            defaultColor={defaultColor}
            defaultIcon={defaultIcon}
            vi={vi}
          />

          <Alert variant="destructive" className="bg-rose-50 border-rose-200">
            <AlertTitle className="text-rose-900 font-semibold">
              {vi ? "Lưu trữ hũ" : "Archive jar"}
            </AlertTitle>
            <AlertDescription className="text-rose-700">
              {vi
                ? "Hũ sẽ ẩn khỏi danh sách chính nhưng lịch sử cũ vẫn được giữ lại."
                : "The jar will be hidden from the main list while keeping past history."}
              <form action={archiveJarDirectAction} className="mt-3">
                <input type="hidden" name="jarId" value={jarId} />
                <Button type="submit" variant="destructive" size="sm" className="rounded-xl">
                  {vi ? "Lưu trữ hũ này" : "Archive this jar"}
                </Button>
              </form>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
