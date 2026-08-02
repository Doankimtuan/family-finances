import { getTranslations } from "next-intl/server";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";

/** Fail-closed money surface when membership cannot be proven (AC-002). */
export async function MoneyMembershipGate() {
  const t = await getTranslations("auth.moneyGate");

  return (
    <div
      data-testid="money-membership-gate"
      className="flex min-h-0 flex-1 flex-col"
    >
      <TopAppBar title={t("title")} />
      <AuthScreenShell centered className="gap-(--space-4)">
        <StatusAlert
          variant="warning"
          title={t("alertTitle")}
          description={t("alertDescription")}
        />
        <Heading level={2} className="text-lg">
          {t("heading")}
        </Heading>
        <Text tone="secondary" size="sm">
          {t("body")}
        </Text>
      </AuthScreenShell>
    </div>
  );
}
