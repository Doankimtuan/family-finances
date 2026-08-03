import { describe, expect, it } from "vitest";
import {
  isGuidedKind,
  isJarResolvableKind,
  mapInboxKind,
  InboxItemKind,
} from "@/modules/inbox/application/inbox-constants";
import {
  acknowledgeInboxItemInputSchema,
  dismissInboxItemInputSchema,
} from "@/modules/inbox/application/review-items";

describe("inbox kind helpers (ST-E06-002)", () => {
  it("maps guided and jar-resolvable kinds", () => {
    expect(mapInboxKind("savings_maturity")).toBe(
      InboxItemKind.SAVINGS_MATURITY,
    );
    expect(mapInboxKind("emi_complete")).toBe(InboxItemKind.EMI_COMPLETE);
    expect(isJarResolvableKind(InboxItemKind.UNMAPPED_EXPENSE)).toBe(true);
    expect(isJarResolvableKind(InboxItemKind.SAVINGS_MATURITY)).toBe(false);
    expect(isGuidedKind(InboxItemKind.EMI_COMPLETE)).toBe(true);
  });
});

describe("dismiss / acknowledge schemas", () => {
  it("requires uuid for dismiss", () => {
    expect(
      dismissInboxItemInputSchema.safeParse({ inboxItemId: "nope" }).success,
    ).toBe(false);
    expect(
      dismissInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("accepts maturity and EMI actions only", () => {
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "renew",
      }).success,
    ).toBe(true);
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "celebrate",
      }).success,
    ).toBe(true);
    expect(
      acknowledgeInboxItemInputSchema.safeParse({
        inboxItemId: "550e8400-e29b-41d4-a716-446655440000",
        action: "delete",
      }).success,
    ).toBe(false);
  });
});
