import { getTranslations } from "next-intl/server";
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
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.SETTINGS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <AccountLifecycleCard />
    </Page>
  );
}
