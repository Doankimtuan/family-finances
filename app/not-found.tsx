import Link from "next/link";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { routing } from "@/i18n/routing";
import { LOCALE_NATIVE_LABEL } from "@/i18n/locales";
import { cn } from "@/shared/utils/cn";
import enErrors from "@/messages/en/errors.json";
import viErrors from "@/messages/vi/errors.json";

const LOCALE_LINK_CLASS_NAME = {
  primary: "bg-accent text-accent-fg hover:bg-accent/90",
  secondary:
    "border border-border-strong text-text-primary hover:bg-surface-hover",
} as const;

/**
 * Global not-found outside `[locale]` (invalid paths before locale negotiation
 * completes). Root layout already provides `<html>` / `<body>`.
 */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-(--space-4) px-(--space-6) text-center">
      <BrandMark variant="soft" size="md" />
      <Heading level={2}>{enErrors.notFound}</Heading>
      <Text tone="secondary" size="sm">
        {viErrors.notFound}
      </Text>
      <Text tone="secondary" size="sm" className="max-w-xs">
        {enErrors.generic}
      </Text>
      <div className="flex flex-wrap items-center justify-center gap-(--space-3)">
        {routing.locales.map((locale) => {
          const isDefault = locale === routing.defaultLocale;
          return (
            <Link
              key={locale}
              href={`/${locale}`}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-(--radius-control) px-(--space-4) text-sm font-medium",
                "transition-[background-color,transform] duration-(--duration-fast) ease-(--ease-standard)",
                "active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                "motion-reduce:transition-none motion-reduce:active:scale-100",
                isDefault
                  ? LOCALE_LINK_CLASS_NAME.primary
                  : LOCALE_LINK_CLASS_NAME.secondary,
              )}
            >
              {LOCALE_NATIVE_LABEL[locale]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
