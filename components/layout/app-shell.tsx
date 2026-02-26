"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AppShell({
  children,
  header,
  footer,
  className,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {header && (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
            {header}
          </div>
        </header>
      )}

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-24 pt-6",
          className,
        )}
      >
        {children}
      </main>

      {footer && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className="mx-auto max-w-2xl">{footer}</div>
        </footer>
      )}
    </div>
  );
}
