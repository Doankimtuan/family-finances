"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Button, type ButtonProps } from "@/shared/ui/button";

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden
      fill="currentColor"
    >
      <path d="M14.73 9.44c-.02-2.04 1.66-3.02 1.74-3.07-0.95-1.39-2.43-1.58-2.95-1.6-1.25-.13-2.45.74-3.08.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.37 6.14 1.02 8.15.68.98 1.49 2.08 2.55 2.04 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.67.64 1.1-.02 1.8-1 2.47-1.99.78-1.14 1.1-2.24 1.12-2.3-.02-.01-2.14-.82-2.18-3.28ZM12.2 3.3c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.85 2.48.9.07 1.82-.46 2.38-1.12Z" />
    </svg>
  );
}

export type SocialButtonProps = Omit<ButtonProps, "variant" | "children"> & {
  provider: "google" | "apple";
  children: ReactNode;
};

/**
 * Provider-styled OAuth buttons (Google light / Apple dark) for auth screens.
 */
export function SocialButton({
  provider,
  className,
  children,
  ...props
}: SocialButtonProps) {
  const isGoogle = provider === "google";
  return (
    <Button
      variant="secondary"
      className={cn(
        "button min-h-14 w-full gap-(--space-3) rounded-(--radius-control) text-sm font-semibold",
        "shadow-none transition-[transform,background-color,opacity] duration-(--duration-fast)",
        // OAuth chrome uses semantic tokens (Google brand glyph colors stay as brand IP).
        isGoogle
          ? "border border-border-subtle bg-surface text-text-primary hover:bg-surface-hover"
          : "border-transparent bg-inverse text-inverse-fg hover:opacity-90",
        className,
      )}
      {...props}
    >
      <span className="inline-flex shrink-0">
        {isGoogle ? <GoogleGlyph /> : <AppleGlyph />}
      </span>
      {children}
    </Button>
  );
}
