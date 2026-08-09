import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AccountLifecycleCard } from "../../account-lifecycle-card";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountSettingsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.SETTINGS_ACCOUNT,
  });
  const t = await getTranslations("settings.account");

  return (
    <Page
      testId="together-account-settings-page"
      topBar={<TopAppBar title={t("title")} subtitle={t("subtitle")} />}
    >
      <AccountLifecycleCard />
      <Link
        href={TOGETHER_PATH.SETTINGS}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
