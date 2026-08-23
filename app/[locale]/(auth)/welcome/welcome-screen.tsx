"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ChartBarLineIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { DEFAULT_CURRENCY } from "@/modules/shared-kernel/currency";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  AuthScreenShell,
  BrandMark,
  Card,
  LocaleSwitcher,
} from "@/shared/patterns";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { CATEGORY_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Text } from "@/shared/ui/text";
import type { IconSvgElement } from "@hugeicons/react";

/** Static illustration values — decorative welcome preview, never user data. */
const PREVIEW_BALANCE = 24_800_000;
const PREVIEW_NET = 4_250_000;

const PREVIEW_SPENDING_ROWS: Array<{
  key: string;
  icon: IconSvgElement;
  tone: IconContainerTone;
  width: string;
}> = [
  { key: "food", icon: CATEGORY_ICONS.food, tone: "expense", width: "w-3/5" },
  {
    key: "transport",
    icon: CATEGORY_ICONS.transport,
    tone: "primary",
    width: "w-2/5",
  },
  {
    key: "shopping",
    icon: CATEGORY_ICONS.shopping,
    tone: "expense",
    width: "w-1/4",
  },
];

const WELCOME_POINTS: Array<{
  icon: IconSvgElement;
  tone: IconContainerTone;
  labelKey: "pointInsight" | "pointTogether" | "pointCalm";
}> = [
  { icon: ChartBarLineIcon, tone: "info", labelKey: "pointInsight" },
  { icon: UserGroupIcon, tone: "primary", labelKey: "pointTogether" },
  { icon: FINANCE_ICONS.savings, tone: "savings", labelKey: "pointCalm" },
];

/**
 * Decorative product preview quoting Home's hero card + spending rows.
 * Clearly badged "Preview"; values are static illustration, not user data.
 */
function WelcomePreview({ locale }: { locale: string }) {
  const t = useTranslations("auth.welcome");

  return (
    <div aria-hidden className="relative pt-9">
      <Card
        tone="elevated"
        className="absolute inset-x-4 top-0 h-[7.5rem] p-(--space-3)"
      >
        <div className="flex flex-col gap-(--space-3)">
          {PREVIEW_SPENDING_ROWS.map((row) => (
            <div key={row.key} className="flex items-center gap-(--space-3)">
              <IconContainer tone={row.tone} size="sm">
                <AppIcon icon={row.icon} size="sm" />
              </IconContainer>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-highlight">
                <div
                  className={`h-full rounded-full bg-border-strong ${row.width}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card tone="hero" className="relative gap-0 p-(--space-4)">
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="sm" weight="medium" className="text-hero-muted">
            {t("previewPeriod")}
          </Text>
          <span className="rounded-full bg-white/15 px-(--space-2) py-0.5 text-xs font-medium text-hero-fg">
            {t("previewBadge")}
          </span>
        </div>
        <p className="mt-(--space-2) text-3xl font-semibold tracking-tight text-hero-fg tabular-nums">
          {formatCurrency(PREVIEW_BALANCE, DEFAULT_CURRENCY, locale, {
            maximumFractionDigits: 0,
          })}
        </p>
        <div className="mt-(--space-4) flex items-center gap-(--space-2) border-t border-white/15 pt-(--space-3)">
          <span className="inline-flex min-h-7 items-center gap-(--space-1) rounded-full bg-white/15 px-(--space-2)">
            <AppIcon icon={FINANCE_ICONS.income} size="xs" />
            <Text size="sm" weight="semibold" tabular className="text-hero-fg">
              {formatCurrency(PREVIEW_NET, DEFAULT_CURRENCY, locale, {
                maximumFractionDigits: 0,
              })}
            </Text>
          </span>
          <Text size="xs" className="text-hero-muted">
            {t("previewNetLabel")}
          </Text>
        </div>
      </Card>
    </div>
  );
}

/**
 * Welcome — the single pre-auth value screen for `/` and `/welcome`.
 * Quotes Home's hero card as the visual anchor; register is the primary CTA.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.welcome");

  return (
    <AuthScreenShell testId="auth-welcome" align="start" withGlow>
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>

      <div className="flex flex-col gap-(--space-3)">
        <BrandMark variant="plate" size="sm" decorative />
        <Heading
          level={1}
          className="text-3xl leading-tight tracking-tight text-text-primary"
        >
          {t("headline")}
        </Heading>
        <Text
          tone="secondary"
          size="base"
          className="max-w-[20rem] leading-relaxed"
        >
          {t("subtitle")}
        </Text>
      </div>

      <WelcomePreview locale={locale} />

      <ul className="flex flex-col gap-(--space-3)">
        {WELCOME_POINTS.map((point) => (
          <li
            key={point.labelKey}
            className="flex items-center gap-(--space-3)"
          >
            <IconContainer tone={point.tone} size="sm">
              <AppIcon icon={point.icon} size="sm" />
            </IconContainer>
            <Text size="sm" weight="medium" className="text-text-primary">
              {t(point.labelKey)}
            </Text>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-(--space-3) pt-(--space-2)">
        <Button
          variant="primary"
          size="md"
          className="min-h-14 w-full text-base font-semibold"
          onPress={() => router.push(APP_PATH.REGISTER)}
        >
          {t("register")}
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="min-h-14 w-full text-base font-semibold"
          onPress={() => router.push(APP_PATH.LOGIN)}
        >
          {t("login")}
        </Button>
      </div>
    </AuthScreenShell>
  );
}
