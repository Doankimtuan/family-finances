"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition-all",
        copied
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary",
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          {t("settings.copied")}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {t("settings.copy")}
        </>
      )}
    </Button>
  );
}
