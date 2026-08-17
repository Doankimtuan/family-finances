import { describe, expect, it } from "vitest";
import { resolveInboxDisplayTitle } from "@/modules/inbox/application/inbox-display";

describe("inbox display title", () => {
  it("prefers note, then category, over the stored title", () => {
    expect(
      resolveInboxDisplayTitle({
        storedTitle: "Unmapped expense",
        note: null,
        categoryName: "Food",
      }),
    ).toBe("Food");

    expect(
      resolveInboxDisplayTitle({
        storedTitle: "Unmapped expense",
        note: "Lunch",
        categoryName: "Food",
      }),
    ).toBe("Lunch");

    expect(
      resolveInboxDisplayTitle({
        storedTitle: "Place income",
        note: null,
        categoryName: "Salary",
      }),
    ).toBe("Salary");
  });

  it("falls back to a blank string when everything is blank", () => {
    expect(
      resolveInboxDisplayTitle({
        storedTitle: "  ",
        note: null,
        categoryName: null,
      }),
    ).toBe("");
  });
});
