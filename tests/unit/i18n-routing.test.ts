import { describe, expect, it } from "vitest";
import { locales, routing } from "@/i18n/routing";
import { toIntlLocale, isAppLocale } from "@/i18n/locales";

describe("i18n routing", () => {
  it("supports en and vi with English default and always prefix", () => {
    expect(locales).toEqual(["en", "vi"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("always");
  });

  it("maps app locales to Intl BCP-47 tags", () => {
    expect(toIntlLocale("en")).toBe("en-US");
    expect(toIntlLocale("vi")).toBe("vi-VN");
    expect(toIntlLocale("fr")).toBe("en-US");
  });

  it("narrows AppLocale", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("vi")).toBe(true);
    expect(isAppLocale("de")).toBe(false);
  });
});
