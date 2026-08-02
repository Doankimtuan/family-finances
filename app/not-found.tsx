import Link from "next/link";
import { BrandMark } from "@/shared/patterns/brand-mark";

/**
 * Global not-found outside `[locale]` (invalid paths before locale negotiation
 * completes). Root layout already provides `<html>` / `<body>`.
 */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark variant="soft" size="md" />
      <h1 className="text-xl font-semibold tracking-tight text-text-primary">
        Page not found
      </h1>
      <p className="max-w-xs text-sm text-text-secondary">
        Something went wrong
      </p>
      <div className="flex gap-3 text-sm font-medium">
        <Link
          href="/en"
          className="rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-accent-fg"
        >
          English
        </Link>
        <Link
          href="/vi"
          className="rounded-[var(--radius-md)] border border-border-strong px-4 py-2.5 text-text-primary"
        >
          Tiếng Việt
        </Link>
      </div>
    </div>
  );
}
