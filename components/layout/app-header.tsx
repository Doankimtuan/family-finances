"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 h-10 w-10 text-slate-600"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <h1 className="text-lg font-semibold text-slate-900 line-clamp-1">
          {title}
        </h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}
