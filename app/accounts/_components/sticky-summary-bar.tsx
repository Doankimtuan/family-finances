"use client";

import { formatVndCompact } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

interface StickySummaryBarProps {
  totalAssets: number;
  totalAssetValue: number;
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
  totalAssetValue,
  totalLiabilities,
  netWorth,
  householdLocale,
  labels,
}: StickySummaryBarProps) {
  return (
    <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-2xl px-4 pb-2">
      <div className="pointer-events-auto grid grid-cols-3 gap-0 rounded-full border border-border/60 bg-white/80 px-3 py-2 text-center shadow-lg backdrop-blur-md">
        <div className="border-r border-border/40 px-2 py-1  flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {labels.assets}
          </p>
          <p className="text-sm font-bold text-success tabular-nums">
            {formatVndCompact(totalAssetValue, householdLocale)}
          </p>
        </div>
        <div className="border-r border-border/40 px-2 py-1  flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {labels.debt}
          </p>
          <p className="text-sm font-bold text-destructive tabular-nums">
            {formatVndCompact(totalLiabilities, householdLocale)}
          </p>
        </div>
        <div className="px-2 py-1  flex flex-col justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
