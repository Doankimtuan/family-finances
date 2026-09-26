import { describe, expect, it } from "vitest";
import {
  CategoryVisualKey,
  categoryVisualFor,
} from "@/shared/ui/icon-registry";
import { IconKey } from "@/modules/ledger/application/icon-constants";
import { CATEGORY_ICON_BY_KEY } from "@/shared/ui/stitch-icon-choices";

describe("categoryVisualFor", () => {
  it("maps known household spending names to stable semantic visual keys", () => {
    expect(
      categoryVisualFor({ categoryId: null, categoryName: "Ăn uống" }).iconKey,
    ).toBe(CategoryVisualKey.FOOD);
    expect(
      categoryVisualFor({ categoryId: null, categoryName: "Di chuyển" })
        .iconKey,
    ).toBe(CategoryVisualKey.TRANSPORT);
    expect(
      categoryVisualFor({ categoryId: null, categoryName: "Sức khỏe" }).iconKey,
    ).toBe(CategoryVisualKey.HEALTH);
  });

  it("uses a calm neutral fallback when category data has no semantic match", () => {
    const visual = categoryVisualFor({
      categoryId: "custom-category-id",
      categoryName: "Custom household choice",
    });
    expect(visual.iconKey).toBe(CategoryVisualKey.OTHER);
    expect(visual.tone).toBe("neutral");
  });

  it("uses a valid saved icon and falls back for an unknown key", () => {
    const saved = categoryVisualFor({
      categoryId: "custom",
      categoryName: "Pets",
      iconKey: IconKey.PETS,
    });
    expect(saved.iconKey).toBe(IconKey.PETS);
    expect(saved.icon).toBe(CATEGORY_ICON_BY_KEY[IconKey.PETS]);
    expect(
      categoryVisualFor({
        categoryId: "custom",
        categoryName: "Pets",
        iconKey: "invalid",
      }).iconKey,
    ).toBe(CategoryVisualKey.OTHER);
  });
});
