import { describe, expect, it } from "vitest";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import {
  InboxGenericTitle,
  resolveInboxDisplayTitle,
} from "@/modules/inbox/application/inbox-display";

describe("inbox display title", () => {
  it("prefers note, then category, over generic Unmapped expense", () => {
    expect(
      resolveInboxDisplayTitle({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        storedTitle: InboxGenericTitle.UNMAPPED_EXPENSE,
        note: null,
        categoryName: "Food",
      }),
    ).toBe("Food");

    expect(
      resolveInboxDisplayTitle({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        storedTitle: InboxGenericTitle.UNMAPPED_EXPENSE,
        note: "Lunch",
        categoryName: "Food",
      }),
    ).toBe("Lunch");

    expect(
      resolveInboxDisplayTitle({
        kind: InboxItemKind.INCOME_SUGGEST,
        storedTitle: InboxGenericTitle.PLACE_INCOME,
        note: null,
        categoryName: "Salary",
      }),
    ).toBe("Salary");
  });
});
