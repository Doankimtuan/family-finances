"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/providers/i18n-provider";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Content rendered to the left of the title. Defaults to the app logo.
   * Pass `<AppHeader.BackButton />` (or your own element) to show a back arrow.
   */
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

/**
 * A convenience sub-component that callers can use when they need a back button.
 * Usage: <AppHeader leftAction={<AppHeader.BackButton />} title="..." />
 */
function BackButton() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.back()}
      className="-ml-2 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-6 w-6" />
      <span className="sr-only">{t("common.back")}</span>
    </Button>
  );
}

const AppLogo = (
  <img
    src="/logo.svg"
    width={32}
    height={32}
    alt="Family Finances logo"
    className="shrink-0 rounded-lg"
  />
);

export function AppHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
}: AppHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {leftAction ?? AppLogo}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] font-medium text-muted-foreground line-clamp-1 -mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightAction && (
        <div className="ml-2 shrink-0 animate-in fade-in slide-in-from-right-2 duration-500">
          {rightAction}
        </div>
      )}
    </div>
  );
}

AppHeader.BackButton = BackButton;
