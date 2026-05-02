"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
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
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      {note ? <p className="mt-1 text-xs text-white/75">{note}</p> : null}
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
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50">
        <div
          className={cn("h-full transition-all duration-1000", color)}
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
  rows: Array<{ label: string; amount: number }>;
  locale: string;
  tone: "success" | "destructive";
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-600">{row.label}</span>
            <span
              className={cn(
                "text-sm font-semibold",
                tone === "success" ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {tone === "success" ? "+" : "-"}
              {formatVndCompact(row.amount, locale)}
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
        "group flex h-auto flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5",
        variant === "primary" && "border-primary/20 bg-primary/5",
      )}
    >
      <Link href={href}>
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
        <span className="text-xs font-semibold">{label}</span>
      </Link>
    </Button>
  );
}

// Minimal Button shim if not importing from UI for simplicity,
// but better to import from @/components/ui/button.
// I'll import from @/components/ui/button in the actual files.
import { Button } from "@/components/ui/button";
