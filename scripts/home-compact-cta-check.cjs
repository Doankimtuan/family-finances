const { chromium } = require("@playwright/test");
const path = require("node:path");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: path.resolve("output/playwright/.auth/user.json"),
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleMessages.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleMessages.push(error.message));
  await page.goto("http://localhost:3000/vi/home", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const result = await page.evaluate(() => {
    const action = document.querySelector('[data-testid="home-capture"], [data-testid="home-add-account"]');
    const floating = document.querySelector('[data-slot="floating-action"]');
    const nav = document.querySelector('[data-slot="bottom-navigation"]');
    const actionRect = action?.getBoundingClientRect();
    const floatingRect = floating?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    return {
      actionCount: document.querySelectorAll('[data-testid="home-capture"], [data-testid="home-add-account"]').length,
      accessibleName: action?.getAttribute("aria-label"),
      width: actionRect?.width ?? null,
      height: actionRect?.height ?? null,
      rightInset: floatingRect ? window.innerWidth - floatingRect.right : null,
      bottomAboveNavigation: floatingRect && navRect ? navRect.top - floatingRect.bottom : null,
      isPointerTransparentWrapper: floating ? getComputedStyle(floating).pointerEvents === "none" : false,
      consoleMessages,
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (result.actionCount !== 1 || result.consoleMessages.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
