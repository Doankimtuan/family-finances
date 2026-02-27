"use client";

import React from "react";
import { HouseholdRealtimeSync } from "@/components/realtime/household-realtime-sync";
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
    <div className="flex min-h-dvh flex-col bg-background">
      <HouseholdRealtimeSync />
      {header && (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
            {header}
          </div>
        </header>
      )}

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-28 pt-6",
          className,
        )}
      >
        {children}
      </main>

      {footer && (
        <footer className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-card shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.1)]">
          <div className="mx-auto w-full max-w-2xl pb-[max(env(safe-area-inset-bottom),0px)]">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}
