import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { setLocale } from "@/i18n/set-locale";
import { resolveAuthenticatedEntryPath } from "@/modules/tenancy/application/resolve-authenticated-entry-path";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { LocaleSwitcher } from "@/shared/patterns/locale-switcher";
import { OpenAppButton } from "./open-app-button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = setLocale(rawLocale);

  const authenticatedPath = await resolveAuthenticatedEntryPath();
  if (authenticatedPath) {
    return redirect({ href: authenticatedPath, locale });
  }

  const t = await getTranslations("common");

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-(--space-6) text-center">
      <div className="absolute inset-x-0 top-0 flex justify-end px-(--space-4) pt-(--space-4)">
        <LocaleSwitcher />
      </div>
      <div className="flex w-full max-w-[var(--app-viewport-max)] flex-col items-center gap-(--space-5)">
        <BrandMark
          variant="plate"
          size="xl"
          decorative={false}
          title={t("brand")}
        />
        <Heading
          level={1}
          className="text-[2.75rem] leading-none tracking-tight text-text-primary sm:text-5xl"
        >
          {t("brand")}
        </Heading>
        <Text tone="secondary" size="base" className="max-w-[18rem]">
          {t("tagline")}
        </Text>
        <OpenAppButton />
      </div>
    </div>
  );
}
