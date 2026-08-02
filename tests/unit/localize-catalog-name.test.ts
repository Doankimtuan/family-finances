import { describe, expect, it } from "vitest";
import {
  catalogSlug,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";

describe("localizeCatalogName", () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      "accounts.cash": "Tiền mặt",
      "tags.food": "Ăn uống",
      "jars.essentials": "Thiết yếu",
    };
    return map[key] ?? key;
  };

  it("slugs known English seed names", () => {
    expect(catalogSlug("Food")).toBe("food");
    expect(catalogSlug("  Essentials ")).toBe("essentials");
  });

  it("translates known system seeds", () => {
    expect(localizeCatalogName(t, "accounts", "Cash")).toBe("Tiền mặt");
    expect(localizeCatalogName(t, "tags", "Food")).toBe("Ăn uống");
    expect(localizeCatalogName(t, "jars", "Essentials")).toBe("Thiết yếu");
  });

  it("leaves custom household names unchanged", () => {
    expect(localizeCatalogName(t, "accounts", "Ví MoMo")).toBe("Ví MoMo");
    expect(localizeCatalogName(t, "jars", "Du lịch Nhật")).toBe("Du lịch Nhật");
  });
});
