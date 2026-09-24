import { getTranslations } from "next-intl/server";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AccountLifecycleCard } from "../../account-lifecycle-card";
import { DailyExpenseReminderSettings } from "./daily-expense-reminder-settings";
import { getDailyExpenseReminderTime } from "@/modules/ledger/application/daily-expense-reminder";
import { EXPENSE_REMINDER_ENV } from "@/modules/ledger/application/expense-reminder-constants";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountSettingsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { user } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.SETTINGS_ACCOUNT,
  });
  const [t, initialTime] = await Promise.all([
    getTranslations("settings.account"),
    getDailyExpenseReminderTime(user.id),
  ]);
  const vapidPublicKey =
    process.env[EXPENSE_REMINDER_ENV.VAPID_PUBLIC_KEY] ?? null;

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
      <DailyExpenseReminderSettings
        initialTime={initialTime}
        vapidPublicKey={vapidPublicKey}
      />
      <AccountLifecycleCard />
    </Page>
  );
}
