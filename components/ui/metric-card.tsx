import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
  href?: string;
  icon?: React.ElementType;
  variant?: "default" | "success" | "destructive" | "warning";
  trend?: {
    value: number;
    label?: string;
    inverse?: boolean;
  };
  tooltip?: string;
  className?: string;
}

import {
  Tooltip as ShTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MetricCard({
  label,
  value,
  note,
  href,
  icon: Icon,
  variant = "default",
  trend,
  tooltip,
  className,
}: MetricCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;
  const isGood = trend?.inverse ? isNegative : isPositive;
  const isBad = trend?.inverse ? isPositive : isNegative;

  const content = (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300",
        href && "hover:border-primary/50 hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors",
                  variant === "default" && "bg-primary/10 text-primary",
                  variant === "success" && "bg-success/10 text-success",
                  variant === "destructive" &&
                    "bg-destructive/10 text-destructive",
                  variant === "warning" && "bg-warning/10 text-warning",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
            )}
            {tooltip ? (
              <ShTooltip>
                <TooltipTrigger asChild>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-primary/70 cursor-help border-b border-dotted border-muted-foreground/30">
                    {label}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </ShTooltip>
            ) : (
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-primary/70">
                {label}
              </p>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-bold",
                isGood && "text-success",
                isBad && "text-destructive",
                !isGood && !isBad && "text-muted-foreground",
              )}
            >
              {isPositive && <ArrowUpRight className="h-3 w-3" />}
              {isNegative && <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p
            className={cn(
              "text-2xl font-bold tracking-tight",
              variant === "success" && "text-success",
              variant === "destructive" && "text-destructive",
              variant === "warning" && "text-warning",
              variant === "default" && "text-foreground",
            )}
          >
            {value}
          </p>
        </div>

        {note && (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground/80 line-clamp-1">
            {note}
          </p>
        )}
      </CardContent>

      {href && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
