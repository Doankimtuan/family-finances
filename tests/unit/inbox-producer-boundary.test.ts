// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const MIGRATIONS_DIR = `${process.cwd()}/supabase/migrations`;

/**
 * Prompt 13B boundary guard.
 *
 * Historical migrations before the gateway contain old `create or replace`
 * versions of producer functions that inserted into inbox_items directly;
 * those functions were later replaced to call the gateway, so the historical
 * text is immutable reference. The meaningful assertions are:
 *   1. No migration after the gateway migration inserts directly (forward
 *      guard — new producers must use the gateway).
 *   2. Every live producer function references the gateway.
 */
describe("Inbox producer boundary (Prompt 13B)", () => {
  it("no migration after the gateway inserts into inbox_items directly", () => {
    const gatewayMigration = "20260817093000_inbox_producer_gateway.sql";
    const offenders: string[] = [];
    for (const file of readdirSync(MIGRATIONS_DIR)) {
      if (!file.endsWith(".sql")) continue;
      if (file <= gatewayMigration) continue;
      const sql = readFileSync(`${MIGRATIONS_DIR}/${file}`, "utf8");
      if (/insert\s+into\s+public\.inbox_items/i.test(sql)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every live producer calls the gateway instead of inserting directly", () => {
    const liveProducerCalls: Array<{
      file: string;
      fn: string;
      usesGateway: boolean;
      directInsert: boolean;
    }> = [];
    const producers: Array<{ fn: string; latestFile: string }> = [
      {
        fn: "public.record_transaction",
        latestFile: "20260804140000_inbox_capture_display_details.sql",
      },
      {
        fn: "public.record_loan_payment",
        latestFile: "20260809100000_cards_loans_payment_safety.sql",
      },
      {
        fn: "public.record_installment_payment",
        latestFile: "20260804160000_sprint45_verification_fixes.sql",
      },
      {
        fn: "public.detect_matured_savings",
        latestFile: "20260817090000_inbox_taxonomy_canonical.sql",
      },
      {
        fn: "public.enqueue_savings_maturity_cascade",
        latestFile: "20260817090000_inbox_taxonomy_canonical.sql",
      },
      {
        fn: "public.reallocate_jar_capacity",
        latestFile: "20260816200000_plan_v2_jar_budget_snapshots.sql",
      },
    ];

    for (const producer of producers) {
      const sql = readFileSync(
        `${MIGRATIONS_DIR}/${producer.latestFile}`,
        "utf8",
      );
      liveProducerCalls.push({
        file: producer.latestFile,
        fn: producer.fn,
        usesGateway: /produce_inbox_item/.test(sql),
        directInsert: /insert\s+into\s+public\.inbox_items/i.test(sql),
      });
    }

    for (const entry of liveProducerCalls) {
      expect(entry.directInsert, `${entry.fn} has no direct insert`).toBe(
        false,
      );
      expect(entry.usesGateway, `${entry.fn} uses the gateway`).toBe(true);
    }
  });

  it("the gateway migration defines produce_inbox_item and the dedupe key", () => {
    const sql = readFileSync(
      `${MIGRATIONS_DIR}/20260817093000_inbox_producer_gateway.sql`,
      "utf8",
    );
    expect(sql).toContain(
      "create or replace function public.produce_inbox_item",
    );
    expect(sql).toContain("add column if not exists dedupe_key text");
    expect(sql).toContain("inbox_items_dedupe_key_unique");
  });

  it("the gateway rejects every removed/merged kind", () => {
    const sql = readFileSync(
      `${MIGRATIONS_DIR}/20260817093000_inbox_producer_gateway.sql`,
      "utf8",
    );
    for (const kind of [
      "savings_matured",
      "renewal_required",
      "penalty_warning",
      "rate_changed_suggestion",
      "package_expired",
      "payment_reminder",
    ]) {
      expect(sql).toContain(kind);
    }
  });
});
