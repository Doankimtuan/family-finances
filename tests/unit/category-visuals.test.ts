import { describe, expect, it } from "vitest";
import {
  CategoryVisualKey,
  categoryVisualFor,
} from "@/shared/ui/icon-registry";

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
});
