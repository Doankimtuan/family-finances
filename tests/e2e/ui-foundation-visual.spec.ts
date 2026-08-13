import { expect, test } from "@playwright/test";

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "440", width: 440, height: 956 },
  { name: "768", width: 768, height: 960 },
  { name: "1280", width: 1280, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`login foundation at ${viewport.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/en/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`login-${viewport.name}.png`),
      fullPage: true,
    });
  });
}
