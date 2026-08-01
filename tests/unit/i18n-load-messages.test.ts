import { describe, expect, it } from "vitest";
import { isModuleNotFound, MESSAGE_NAMESPACES } from "@/i18n/load-messages";
import { LOCALE_LABEL_KEY } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

describe("isModuleNotFound", () => {
  it("detects node module-not-found codes", () => {
    expect(isModuleNotFound({ code: "MODULE_NOT_FOUND" })).toBe(true);
    expect(isModuleNotFound({ code: "ERR_MODULE_NOT_FOUND" })).toBe(true);
  });

  it("detects bundler missing-module messages", () => {
    expect(
      isModuleNotFound({ message: "Cannot find module './missing.json'" }),
    ).toBe(true);
  });

  it("does not treat parse/runtime errors as missing modules", () => {
    expect(isModuleNotFound({ message: "Unexpected token < in JSON" })).toBe(
      false,
    );
    expect(isModuleNotFound(new TypeError("broken"))).toBe(false);
    expect(isModuleNotFound(null)).toBe(false);
  });
});

describe("locale label map", () => {
  it("covers every configured locale", () => {
    for (const locale of routing.locales) {
      expect(LOCALE_LABEL_KEY[locale]).toBeTruthy();
    }
  });
});

describe("message namespaces", () => {
  it("stays non-empty and unique", () => {
    expect(MESSAGE_NAMESPACES.length).toBeGreaterThan(0);
    expect(new Set(MESSAGE_NAMESPACES).size).toBe(MESSAGE_NAMESPACES.length);
  });
});
