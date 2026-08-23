"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppIcon } from "@/shared/ui/app-icon";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { BrandMark } from "@/shared/patterns/brand-mark";

export type AuthScreenHeaderProps = {
  /** Screen title (h1). */
  title: string;
  subtitle?: string;
  /** Locale-relative href for the back affordance; omit on entry screens. */
  backHref?: string;
  /** Accessible label for the back link; defaults to auth.backToWelcome. */
  backLabel?: string;
  /** Hide the brand mark (e.g. nested sub-flows). Default: shown. */
  hideBrandMark?: boolean;
};

/**
 * Compact, left-aligned header shared by auth/onboarding forms — the sibling
 * family rule for Login / Register / Forgot Password (Design System §45).
 */
export function AuthScreenHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  hideBrandMark = false,
}: AuthScreenHeaderProps) {
  const tAuth = useTranslations("auth");

  return (
    <header className="flex flex-col gap-(--space-4)">
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel ?? tAuth("backToWelcome")}
          className="-ms-(--space-2) flex size-11 items-center justify-center rounded-(--radius-control) text-text-secondary transition-colors duration-(--duration-fast) ease-(--ease-standard) hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <AppIcon icon={ACTION_ICONS.back} size="md" />
        </Link>
      ) : null}
      <div className="flex flex-col gap-(--space-3)">
        {hideBrandMark ? null : <BrandMark variant="soft" size="sm" />}
        <div className="flex flex-col gap-(--space-1)">
          <Heading level={1} className="text-2xl leading-tight tracking-tight">
            {title}
          </Heading>
          {subtitle ? (
            <Text tone="secondary" size="sm" className="leading-relaxed">
              {subtitle}
            </Text>
          ) : null}
        </div>
      </div>
    </header>
  );
}
