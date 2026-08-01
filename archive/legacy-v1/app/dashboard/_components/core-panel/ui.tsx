"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVndCompact } from "@/lib/dashboard/format";

export function HeroStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {note ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function HealthFactor({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{score.toFixed(0)}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.max(0, Math.min(100, score))}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-1000", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function TransparencyList({
  title,
  rows,
  locale,
  tone,
}: {
  title: string;
  rows: Array<{ label: string; amount?: number; value?: number }>;
  locale: string;
  tone: "success" | "destructive";
}) {
  const getAmount = (row: { amount?: number; value?: number }) =>
    row.amount ?? row.value ?? 0;

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-foreground/80">{row.label}</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                tone === "success" ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {tone === "success" ? "+" : "-"}
              {formatVndCompact(getAmount(row), locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickAction({
  href,
  icon: Icon,
  label,
  variant = "default",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  variant?: "default" | "primary";
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "group h-auto rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 active:translate-y-0",
        variant === "primary" && "border-primary/20 bg-primary/5 shadow-sm",
      )}
    >
      <Link href={href} className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 transition group-hover:scale-110",
            variant === "primary"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground group-hover:text-primary",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-center text-xs font-semibold leading-5 text-foreground">
          {label}
        </span>
      </Link>
    </Button>
  );
}
