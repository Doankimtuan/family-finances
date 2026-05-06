import * as React from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { OnboardingActionState } from "../action-types";

type OnboardingFieldProps = {
  htmlFor: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function OnboardingField({
  htmlFor,
  label,
  hint,
  required = false,
  className,
  children,
}: OnboardingFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          <span className="inline-flex items-center gap-1.5">
            {label}
            {required ? (
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Required
              </span>
            ) : null}
          </span>
        </Label>
      </div>

      {children}

      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type OnboardingStatusMessageProps = {
  state: Pick<OnboardingActionState, "status" | "message">;
};

export function OnboardingStatusMessage({ state }: OnboardingStatusMessageProps) {
  if (state.status === "idle" || !state.message) return null;

  const isSuccess = state.status === "success";

  return (
    <Alert
      variant={isSuccess ? "success" : "destructive"}
      className={cn(
        "items-start border-0 shadow-sm",
        isSuccess
          ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100"
          : "bg-rose-50 text-rose-950 dark:bg-destructive/10 dark:text-destructive-foreground",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isSuccess
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "bg-rose-100 text-rose-700 dark:bg-destructive/20 dark:text-destructive-foreground",
          )}
        >
          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
        </div>
        <AlertDescription className="text-sm leading-6 text-inherit">
          {state.message}
        </AlertDescription>
      </div>
    </Alert>
  );
}
