"use client";

import { formatVndCompact } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

interface StickySummaryBarProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  householdLocale: string;
  labels: {
    assets: string;
    debt: string;
    net: string;
  };
}

/**
 * Fixed bottom summary bar showing assets / debt / net.
 * Must be a Client Component because it reads locale-sensitive formatting
 * and sits in a fixed position overlay.
 */
export function StickySummaryBar({
  totalAssets,
  totalLiabilities,
  netWorth,
  householdLocale,
  labels,
}: StickySummaryBarProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-2xl px-4 pb-2 pointer-events-none">
      <div className="pointer-events-auto bg-background/90 backdrop-blur-md border border-border/60 rounded-2xl shadow-lg p-3 grid grid-cols-3 gap-0 text-center">
        <div className="border-r border-border/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {labels.assets}
          </p>
          <p className="text-sm font-bold text-success tabular-nums">
            {formatVndCompact(totalAssets, householdLocale)}
          </p>
        </div>
        <div className="border-r border-border/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {labels.debt}
          </p>
          <p className="text-sm font-bold text-destructive tabular-nums">
            {formatVndCompact(totalLiabilities, householdLocale)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {labels.net}
          </p>
          <p
            className={cn(
              "text-sm font-bold tabular-nums",
              netWorth >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {formatVndCompact(netWorth, householdLocale)}
          </p>
        </div>
      </div>
    </div>
  );
}
