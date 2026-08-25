"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABEL_KEY } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { cn } from "@/shared/utils/cn";

/**
 * Foundation locale switcher — not a Settings product screen.
 * Switches path prefix while preserving the current pathname.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("settings");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label={tA11y("localeSwitcher")}
      className={cn("inline-flex items-center gap-1 text-sm", className)}
    >
      <span className="sr-only">{t("language")}</span>
      {routing.locales.map((code) => {
        const active = locale === code;
        const label = t(LOCALE_LABEL_KEY[code]);
        return (
          <button
            key={code}
            type="button"
            className={cn(
              "min-h-9 rounded-(--radius-control) px-(--space-3) font-medium",
              "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              active
                ? "bg-accent text-accent-fg"
                : "text-text-secondary hover:text-text-primary",
            )}
            aria-pressed={active}
            onClick={() => {
              router.replace(pathname, { locale: code });
            }}
          >
            {code.toUpperCase()}
            <span className="sr-only"> — {label}</span>
          </button>
        );
      })}
    </div>
  );
}
