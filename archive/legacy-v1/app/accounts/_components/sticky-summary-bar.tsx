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
  totalAssets: _totalAssets,
  totalAssetValue,
  totalLiabilities,
  netWorth,
  householdLocale,
  labels,
}: StickySummaryBarProps) {
  return (
    <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-20 mx-auto max-w-2xl px-4 pb-2">
      <div className="pointer-events-auto grid grid-cols-3 gap-0 rounded-full border border-border/60 bg-card/90 px-3 py-2 text-center shadow-[0_8px_24px_-12px_hsl(var(--shadow-color)/0.12)] backdrop-blur-md">
        <div className="flex flex-col justify-between border-r border-border/40 px-2 py-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            {labels.assets}
          </p>
          <p className="font-serif text-sm font-semibold tabular-nums text-success">
            {formatVndCompact(totalAssetValue, householdLocale)}
          </p>
        </div>
        <div className="flex flex-col justify-between border-r border-border/40 px-2 py-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            {labels.debt}
          </p>
          <p className="font-serif text-sm font-semibold tabular-nums text-destructive">
            {formatVndCompact(totalLiabilities, householdLocale)}
          </p>
        </div>
        <div className="flex flex-col justify-between px-2 py-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            {labels.net}
          </p>
          <p
            className={cn(
              "font-serif text-sm font-semibold tabular-nums",
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
