"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  rightAction,
}: AppHeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">{t("common.back")}</span>
          </Button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">
          {title}
        </h1>
      </div>
      {rightAction && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-500">
          {rightAction}
        </div>
      )}
    </div>
  );
}
