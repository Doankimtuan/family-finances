/**
 * AC-INB-01 + BR-15/16/21 contracts for Sprint 3 Inbox Decision Engine and
 * Prompt 13A canonical taxonomy.
 */
import { describe, expect, it } from "vitest";
import {
  InboxItemKind,
  InboxItemStatus,
  AUTO_RESOLVE_CONFIDENCE_THRESHOLD,
  MERCHANT_CONFIRMATION_THRESHOLD,
  INBOX_LEGACY_KIND_VALUES,
  INBOX_KIND_MIGRATION_MAP,
  isJarResolvableKind,
  isGuidedKind,
} from "@/modules/inbox/application";
import {
  instantiateTypedReviewItem,
  parseTypedReviewItem,
  OUTCOMES_BY_KIND,
  TERMINAL_STATUSES_BY_KIND,
  ACK_ACTION_BY_KIND,
  kindAutoResolvable,
  isCanonicalInboxKind,
} from "@/modules/inbox/application";
import {
  confidenceFromConfirmations,
  shouldAutoResolveInboxItem,
  shouldCancelMaturityCascade,
} from "@/modules/inbox/application";
import { TransactionSource } from "@/modules/ledger/application/client";
import { LoanDueState } from "@/modules/ledger/application/loan-constants";
import { DebtDueState } from "@/modules/ledger/application/debt-constants";

const TX = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const JAR = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("AC-INB-01 GWT — typed ReviewItem instantiation (Prompt 13A)", () => {
  it("instantiates typed payloads for every canonical kind", () => {
    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        sourceId: TX,
        suggestedJarId: JAR,
      })?.type,
    ).toBe(InboxItemKind.UNMAPPED_EXPENSE);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.INCOME_SUGGEST,
        sourceId: TX,
      })?.type,
    ).toBe(InboxItemKind.INCOME_SUGGEST);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.SAVINGS_MATURITY,
        sourceId: TX,
        contextJson: { cycleId: TX, providerName: "Bank", currentPackage: "P" },
      })?.type,
    ).toBe(InboxItemKind.SAVINGS_MATURITY);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION,
        sourceId: TX,
      })?.type,
    ).toBe(InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EMI_COMPLETE,
        sourceId: TX,
      })?.type,
    ).toBe(InboxItemKind.EMI_COMPLETE);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EMERGENCY_DECLARATION,
        sourceId: TX,
        intentNote: "Medical bill",
      })?.type,
    ).toBe(InboxItemKind.EMERGENCY_DECLARATION);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.LOAN_PAYMENT_ATTENTION,
        sourceId: TX,
        contextJson: { dueState: LoanDueState.DUE_SOON, dueDate: "2026-08-26" },
      })?.type,
    ).toBe(InboxItemKind.LOAN_PAYMENT_ATTENTION);

    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.DEBT_PAYMENT_ATTENTION,
        sourceId: TX,
        contextJson: { dueState: DebtDueState.DUE_SOON, dueDate: "2026-08-26" },
      })?.type,
    ).toBe(InboxItemKind.DEBT_PAYMENT_ATTENTION);
  });

  it("parses the discriminated union schema for every canonical kind", () => {
    for (const kind of Object.values(InboxItemKind)) {
      const instance = instantiateTypedReviewItem({
        kind,
        sourceId: TX,
        intentNote:
          kind === InboxItemKind.EMERGENCY_DECLARATION ? "note" : undefined,
        contextJson:
          kind === InboxItemKind.LOAN_PAYMENT_ATTENTION
            ? { dueState: LoanDueState.DUE_SOON, dueDate: "2026-08-26" }
            : kind === InboxItemKind.DEBT_PAYMENT_ATTENTION
              ? { dueState: DebtDueState.DUE_SOON, dueDate: "2026-08-26" }
              : undefined,
      });
      expect(instance, `kind ${kind}`).not.toBeNull();
      expect(
        parseTypedReviewItem(instance).ok,
        `schema accepts kind ${kind}`,
      ).toBe(true);
    }
  });

  it("rejects payloads that do not belong to their kind", () => {
    // InstallmentComplete requires uuid-valid installmentPlanId/debtId; an
    // UnmappedExpense-only payload must fail the discriminated union.
    const parsed = parseTypedReviewItem({
      type: InboxItemKind.EMI_COMPLETE,
      payload: { transactionId: TX },
    });
    expect(parsed.ok).toBe(false);
  });

  it("requires the emergency intent note", () => {
    expect(
      instantiateTypedReviewItem({
        kind: InboxItemKind.EMERGENCY_DECLARATION,
        sourceId: TX,
        intentNote: null,
      }),
    ).toBeNull();
  });
});

describe("Prompt 13A taxonomy contract", () => {
  it("every canonical kind is recognized and no legacy kind is canonical", () => {
    for (const kind of Object.values(InboxItemKind)) {
      expect(isCanonicalInboxKind(kind)).toBe(true);
    }
    for (const legacy of INBOX_LEGACY_KIND_VALUES) {
      expect(isCanonicalInboxKind(legacy)).toBe(false);
    }
  });

  it("every canonical kind has at least one valid outcome and terminal status", () => {
    for (const kind of Object.values(InboxItemKind)) {
      expect(
        OUTCOMES_BY_KIND[kind].length,
        `kind ${kind} has outcomes`,
      ).toBeGreaterThan(0);
      expect(
        TERMINAL_STATUSES_BY_KIND[kind].length,
        `kind ${kind} has terminal statuses`,
      ).toBeGreaterThan(0);
    }
  });

  it("legacy kinds never map to an active queue entry", () => {
    for (const legacy of INBOX_LEGACY_KIND_VALUES) {
      if (INBOX_KIND_MIGRATION_MAP[legacy] != null) {
        expect(Object.values(InboxItemKind)).toContain(
          INBOX_KIND_MIGRATION_MAP[legacy],
        );
      }
    }
  });

  it("jar-resolvable kinds are the auto-resolvable kinds", () => {
    for (const kind of Object.values(InboxItemKind)) {
      expect(kindAutoResolvable(kind)).toBe(isJarResolvableKind(kind));
    }
  });

  it("exhaustive ack contract: every ack-able kind lists its actions", () => {
    expect(ACK_ACTION_BY_KIND[InboxItemKind.SAVINGS_MATURITY]).toContain(
      "confirm_configured",
    );
    expect(
      ACK_ACTION_BY_KIND[InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION],
    ).toContain("confirm");
    expect(ACK_ACTION_BY_KIND[InboxItemKind.EMI_COMPLETE]).toContain(
      "celebrate",
    );
    expect(ACK_ACTION_BY_KIND[InboxItemKind.UNMAPPED_EXPENSE]).toHaveLength(0);
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
        kind: InboxItemKind.SAVINGS_MATURITY,
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

describe("BR-15 / BR-21 staleness and cascade cancel (Prompt 13A)", () => {
  it("cancels maturity cascade for the single canonical maturity kind", () => {
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

  it("guided kinds are exactly the non-jar canonical kinds", () => {
    for (const kind of Object.values(InboxItemKind)) {
      expect(isGuidedKind(kind)).toBe(!isJarResolvableKind(kind));
    }
  });
});
