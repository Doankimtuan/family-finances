import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  title?: string;
  description?: string;
  rightAction?: React.ReactNode;
  icon?: React.ReactNode;
}

export function SectionHeader({
  label,
  title,
  description,
  rightAction,
  icon,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary transition-colors">
          {label}
        </p>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <div className="flex items-center gap-2">
              {icon && (
                React.isValidElement(icon) ? (
                  icon
                ) : (
                  React.createElement(icon as React.ElementType, {
                    className: "h-5 w-5 text-primary/80",
                  })
                )
              )}
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
