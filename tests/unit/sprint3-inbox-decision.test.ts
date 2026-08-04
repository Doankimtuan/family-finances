/**
 * AC-INB-01 + BR-15/16/21 contracts for Sprint 3 Inbox Decision Engine.
 */
import { describe, expect, it } from "vitest";
import {
  ReviewItemType,
  InboxItemKind,
  InboxItemStatus,
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  MERCHANT_CONFIRMATION_THRESHOLD,
  PAYMENT_REMINDER_EXPIRE_DAYS,
  toReviewItemType,
  reviewItemTypeToKind,
  instantiateTypedReviewItem,
  parseTypedReviewItem,
  confidenceFromConfirmations,
  shouldAutoResolveInboxItem,
  shouldCancelMaturityCascade,
  isPaymentReminderExpired,
  paymentReminderExpiresAt,
} from "@/modules/inbox/application";
import { TransactionSource } from "@/modules/ledger/application/client";

const TX = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const JAR = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("AC-INB-01 GWT — typed ReviewItem instantiation", () => {
  it("maps all Spec ReviewItemType values from storage kinds", () => {
    expect(toReviewItemType(InboxItemKind.UNMAPPED_EXPENSE)).toBe(
      ReviewItemType.UNMAPPED_EXPENSE,
    );
    expect(toReviewItemType(InboxItemKind.SAVINGS_MATURITY)).toBe(
      ReviewItemType.MATURITY_DECISION,
    );
    expect(toReviewItemType(InboxItemKind.PAYMENT_REMINDER)).toBe(
      ReviewItemType.PAYMENT_REMINDER,
    );
    expect(toReviewItemType(InboxItemKind.EMI_COMPLETE)).toBe(
      ReviewItemType.INSTALLMENT_COMPLETE,
    );
    expect(toReviewItemType(InboxItemKind.EMERGENCY_DECLARATION)).toBe(
      ReviewItemType.EMERGENCY_DECLARATION,
    );
    expect(reviewItemTypeToKind(ReviewItemType.PAYMENT_REMINDER)).toBe(
      InboxItemKind.PAYMENT_REMINDER,
    );
  });

  it("instantiates explicit typed schemas for each Spec type", () => {
    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        sourceId: TX,
        suggestedJarId: JAR,
      })?.type,
    ).toBe(ReviewItemType.UNMAPPED_EXPENSE);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.SAVINGS_MATURITY,
        sourceId: TX,
        cascadeDay: 14,
      })?.type,
    ).toBe(ReviewItemType.MATURITY_DECISION);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.PAYMENT_REMINDER,
        sourceId: TX,
        dueAt: "2026-08-01T00:00:00.000Z",
        expiresAt: "2026-08-08T00:00:00.000Z",
      })?.type,
    ).toBe(ReviewItemType.PAYMENT_REMINDER);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EMI_COMPLETE,
        sourceId: TX,
      })?.type,
    ).toBe(ReviewItemType.INSTALLMENT_COMPLETE);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EMERGENCY_DECLARATION,
        sourceId: TX,
        intentNote: "Medical bill",
      })?.type,
    ).toBe(ReviewItemType.EMERGENCY_DECLARATION);

    const parsed = parseTypedReviewItem({
      type: ReviewItemType.UNMAPPED_EXPENSE,
      payload: { transactionId: TX, suggestedJarId: JAR },
    });
    expect(parsed.ok).toBe(true);
  });
});

describe("BR-16 pattern auto-resolution confidence", () => {
  it("silent auto-resolves only at confidence >= 0.90 with suggested jar", () => {
    expect(confidenceFromConfirmations(MERCHANT_CONFIRMATION_THRESHOLD)).toBe(
      AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
    );
    expect(
      shouldAutoResolveInboxItem({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        confidenceScore: AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
        suggestedJarId: JAR,
      }),
    ).toBe(true);
    expect(
      shouldAutoResolveInboxItem({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        confidenceScore: 0.89,
        suggestedJarId: JAR,
      }),
    ).toBe(false);
    expect(
      shouldAutoResolveInboxItem({
        kind: InboxItemKind.PAYMENT_REMINDER,
        confidenceScore: 1,
        suggestedJarId: JAR,
      }),
    ).toBe(false);
  });

  it("declares transaction source constants for pattern metadata", () => {
    expect(TransactionSource.RECURRING_PATTERN).toBe("recurring_pattern");
    expect(TransactionSource.MANUAL).toBe("manual");
  });
});

describe("BR-15 / BR-21 staleness and cascade cancel", () => {
  it("expires payment reminders after due + 7 days", () => {
    const due = new Date("2026-08-01T00:00:00.000Z");
    const expires = paymentReminderExpiresAt(due, PAYMENT_REMINDER_EXPIRE_DAYS);
    expect(expires.toISOString()).toBe("2026-08-08T00:00:00.000Z");
    expect(
      isPaymentReminderExpired({
        kind: InboxItemKind.PAYMENT_REMINDER,
        expiresAt: "2026-08-01T00:00:00.000Z",
        now: new Date("2026-08-02T00:00:00.000Z"),
      }),
    ).toBe(true);
    expect(
      isPaymentReminderExpired({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        expiresAt: "2026-08-01T00:00:00.000Z",
        now: new Date("2026-08-02T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("cancels maturity cascade when a maturity decision is resolved", () => {
    expect(
      shouldCancelMaturityCascade({
        kind: InboxItemKind.SAVINGS_MATURITY,
        resolved: true,
      }),
    ).toBe(true);
    expect(
      shouldCancelMaturityCascade({
        kind: InboxItemKind.EMI_COMPLETE,
        resolved: true,
      }),
    ).toBe(false);
    expect(InboxItemStatus.EXPIRED).toBe("expired");
    expect(InboxItemStatus.AUTO_RESOLVED).toBe("auto_resolved");
  });
});
