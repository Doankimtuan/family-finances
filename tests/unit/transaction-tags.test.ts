import { describe, expect, it } from "vitest";
import {
  TransactionTagColorKey,
  TransactionTagIconKey,
  transactionMatchesTagFilter,
  type TransactionTag,
} from "@/modules/ledger/application/client";

const tags: TransactionTag[] = [
  {
    id: "work",
    name: "Work",
    iconKey: TransactionTagIconKey.WORK,
    colorKey: TransactionTagColorKey.BLUE,
    archivedAt: null,
  },
  {
    id: "travel",
    name: "Travel",
    iconKey: TransactionTagIconKey.TRAVEL,
    colorKey: TransactionTagColorKey.VIOLET,
    archivedAt: null,
  },
];

describe("transaction tag filter semantics", () => {
  it("matches any selected tag within the tag dimension", () => {
    expect(transactionMatchesTagFilter(tags, ["missing", "travel"])).toBe(true);
    expect(transactionMatchesTagFilter(tags, ["missing"])).toBe(false);
  });

  it("matches every transaction when no tag filter is selected", () => {
    expect(transactionMatchesTagFilter(tags, [])).toBe(true);
  });
});
