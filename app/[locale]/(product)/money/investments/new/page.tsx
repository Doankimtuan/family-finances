import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { StatusAlert } from "@/shared/ui/status-alert";
import { OpeningPositionForm } from "../opening-position-form";
import { APP_PATH } from "@/modules/tenancy/application/app-path";

export default async function InvestmentOpeningPage() {
  const t = await getTranslations("money.investments.opening");
  return (
    <Page
      testId="money-investments-new"
      topBar={
        <TopAppBar
          variant="form"
          backHref={APP_PATH.MONEY_INVESTMENTS}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      <StatusAlert variant="info" title={t("noMoneyMovement")} />
      <OpeningPositionForm />
    </Page>
  );
}
