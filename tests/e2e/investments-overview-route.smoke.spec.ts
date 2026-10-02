import { expect, test } from "@playwright/test";
import {
  APP_PATH,
  moneyInvestmentPath,
  moneyInvestmentBuyPath,
  moneyInvestmentSellPath,
  moneyInvestmentValuationPath,
} from "@/modules/tenancy/application/app-path";
import { locales } from "@/i18n/routing";

const HOLDING_ID = "00000000-0000-4000-8000-000000000001";

for (const locale of locales) {
  for (const path of [
    APP_PATH.MONEY_INVESTMENTS,
    APP_PATH.MONEY_INVESTMENTS_OVERVIEW,
    APP_PATH.MONEY_INVESTMENTS_NEW,
    moneyInvestmentPath(HOLDING_ID),
    moneyInvestmentBuyPath(HOLDING_ID),
    moneyInvestmentSellPath(HOLDING_ID),
    moneyInvestmentValuationPath(HOLDING_ID),
  ]) {
    test(`investments requires authentication (${locale}, ${path})`, async ({
      page,
    }) => {
      await page.goto(`/${locale}${path}`);
      await expect(page).toHaveURL(
        new RegExp(`/${locale}${APP_PATH.LOGIN}(?:\\?.*)?$`),
      );
      await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    });
  }
}
