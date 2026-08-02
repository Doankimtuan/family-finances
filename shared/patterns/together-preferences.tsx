"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/shared/patterns/card";
import { LocaleSwitcher } from "@/shared/patterns/locale-switcher";
import { ThemeToggle } from "@/shared/patterns/theme-toggle";
import { Text } from "@/shared/ui/text";

/**
 * Together preferences strip — theme + locale (Design Foundation: toggle lives here).
 */
export function TogetherPreferences() {
  const t = useTranslations("settings");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-(--space-4) p-(--space-4)">
        <div className="flex flex-col gap-(--space-2)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("appearance")}
          </Text>
          <ThemeToggle />
        </div>
        <div className="h-px w-full bg-divider" role="separator" aria-hidden />
        <div className="flex items-center justify-between gap-(--space-3)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("language")}
          </Text>
          <LocaleSwitcher />
        </div>
      </div>
    </Card>
  );
}
