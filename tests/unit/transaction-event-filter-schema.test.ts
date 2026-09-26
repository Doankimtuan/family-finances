import { describe, expect, it } from "vitest";
import {
  TransactionFilterType,
  TRANSACTION_SEARCH_MAX_LENGTH,
} from "@/modules/ledger/application";
import { transactionEventFilterSchema } from "@/modules/ledger/application/transaction-events-schema";

describe("transaction event filter schema", () => {
  it("normalizes the note query and removes repeated tags", () => {
    const result = transactionEventFilterSchema.parse({
      type: TransactionFilterType.EXPENSE,
      tags: "0dcdac84-bd40-4921-a9ac-681fa4988ada,0dcdac84-bd40-4921-a9ac-681fa4988ada",
      q: "  Lunch  ",
      category:
        "269cd068-6eea-4fae-88da-19887164a1a7,269cd068-6eea-4fae-88da-19887164a1a7,8c73b7d2-5f84-4e80-a267-84df04a48f01",
      jar: "9f5fc412-3fc9-4b6b-baf6-f20d95f5747e,ea320f54-82bd-42b0-ae09-bb25fd9aa200",
    });

    expect(result).toEqual({
      type: TransactionFilterType.EXPENSE,
      tagIds: ["0dcdac84-bd40-4921-a9ac-681fa4988ada"],
      q: "Lunch",
      categoryIds: [
        "269cd068-6eea-4fae-88da-19887164a1a7",
        "8c73b7d2-5f84-4e80-a267-84df04a48f01",
      ],
      jarIds: [
        "9f5fc412-3fc9-4b6b-baf6-f20d95f5747e",
        "ea320f54-82bd-42b0-ae09-bb25fd9aa200",
      ],
    });
  });

  it("keeps existing single category and jar URLs valid", () => {
    const result = transactionEventFilterSchema.parse({
      category: "269cd068-6eea-4fae-88da-19887164a1a7",
      jar: "9f5fc412-3fc9-4b6b-baf6-f20d95f5747e",
    });

    expect(result.categoryIds).toEqual([
      "269cd068-6eea-4fae-88da-19887164a1a7",
    ]);
    expect(result.jarIds).toEqual(["9f5fc412-3fc9-4b6b-baf6-f20d95f5747e"]);
  });

  it("rejects invalid ids and overly long note queries", () => {
    expect(
      transactionEventFilterSchema.safeParse({
        category: "not-a-uuid",
      }).success,
    ).toBe(false);
    expect(
      transactionEventFilterSchema.safeParse({
        q: "x".repeat(TRANSACTION_SEARCH_MAX_LENGTH + 1),
      }).success,
    ).toBe(false);
  });
});
