"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormStatusProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string | null;
  status?: "error" | "success" | "idle" | "pending";
}

export function FormStatus({ message, status, className, ...props }: FormStatusProps) {
  if (!message || status === "idle" || status === "pending") return null;

  const isError = status === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-300",
        isError ? "text-rose-600" : "text-emerald-600",
        className
      )}
      {...props}
    >
      {message}
    </p>
  );
}
