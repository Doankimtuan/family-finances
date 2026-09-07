"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import { HOUSEHOLD_LOCALE } from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { BottomActionBar } from "@/shared/patterns/bottom-action-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { SelectField } from "@/shared/ui/form/select-field";
import { updatePreferencesAction } from "./actions";
import { useStatusAlert } from "@/providers/status-alert-provider";

export function HouseholdPreferencesForm({
  initial,
}: {
  initial: HouseholdPreferences;
}) {
  const t = useTranslations("together.preferences");
  const router = useRouter();
  const [locale, setLocale] = useState(initial.locale);
  const [isPending, startTransition] = useTransition();
  const statusAlert = useStatusAlert();
  const dirty = locale !== initial.locale;
  const localeOptions = [
    {
      id: HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
      label: t("localeEnglish"),
    },
    {
      id: HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM,
      label: t("localeVietnamese"),
    },
  ] as const;

  const onSave = () => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await updatePreferencesAction({
        locale,
        timezone: initial.timezone,
        baseCurrency: initial.baseCurrency,
      });
      if (result.status === "success") {
        statusAlert.show({
          variant: AlertVariant.SUCCESS,
          title: t("savedTitle"),
          description: t("savedBody"),
        });
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("errorTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="household-preferences"
    >
      {!initial.canEdit ? (
        <StatusAlert
          variant={AlertVariant.INFO}
          title={t("readOnlyTitle")}
          description={t("readOnlyBody")}
        />
      ) : null}

      <StatusAlert
        variant={AlertVariant.INFO}
        title={t("moneySafeTitle")}
        description={t("moneySafeBody")}
      />

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("interpretationTitle")}
          description={t("interpretationDescription")}
        />
        <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
          <SelectField
            id="household-locale"
            label={t("localeLabel")}
            description={t("localeDescription")}
            value={locale}
            onChange={(value) => {
              if (
                value === HOUSEHOLD_LOCALE.ENGLISH_VIETNAM ||
                value === HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
              ) {
                setLocale(value);
              }
            }}
            options={localeOptions}
            isDisabled={!initial.canEdit || isPending}
            data-testid="household-locale"
          />

          <div className="flex flex-col gap-(--space-1)">
            <Text size="sm" tone="secondary">
              {t("timezoneLabel")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {initial.timezone}
            </Text>
          </div>
          <div className="flex flex-col gap-(--space-1)">
            <Text size="sm" tone="secondary">
              {t("currencyLabel")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {initial.baseCurrency}
            </Text>
          </div>
        </Card>
      </section>

      {initial.canEdit ? (
        <BottomActionBar>
          <Button
            variant="primary"
            className="w-full"
            data-testid="preferences-save"
            isDisabled={!dirty || isPending}
            isPending={isPending}
            onPress={onSave}
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </BottomActionBar>
      ) : null}
    </div>
  );
}
