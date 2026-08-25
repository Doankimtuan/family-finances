// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const MIGRATIONS_DIR = `${process.cwd()}/supabase/migrations`;

function extractFunctionBlock(sql: string, functionName: string): string {
  const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = sql.search(
    new RegExp(`create\\s+or\\s+replace\\s+function\\s+${escapedName}\\b`, "i"),
  );
  if (start < 0) return "";

  const remainder = sql.slice(start + 1);
  const nextFunction = remainder.search(/create\s+or\s+replace\s+function\s+/i);
  return sql.slice(
    start,
    nextFunction < 0 ? sql.length : start + 1 + nextFunction,
  );
}

/**
 * Inbox producer boundary guards (Prompts 13B + 13D).
 *
 * Historical migrations before the gateway contain old `create or replace`
 * versions of producer functions that inserted into inbox_items directly;
 * those functions were later replaced to call the gateway, so the historical
 * text is immutable reference. The meaningful assertions are:
 *   1. No migration after the last gateway migration inserts directly (forward
 *      guard — new producers must use the gateway).
 *   2. Every live producer function references the gateway.
 *   3. The gateway enforces per-kind reopen policy and cycle-scoped dedupe.
 */
describe("Inbox producer boundary (Prompt 13B/13D)", () => {
  const GATEWAY_MIGRATIONS = [
    "20260817224939_inbox_producer_gateway.sql",
    "20260818002352_inbox_integration_hardening.sql",
    "20260824022207_inbox_loan_debt_attention_18b.sql",
  ];

  it("no migration after the gateway migrations inserts into inbox_items directly", () => {
    const lastGatewayMigration =
      GATEWAY_MIGRATIONS[GATEWAY_MIGRATIONS.length - 1];
    const offenders: string[] = [];
    for (const file of readdirSync(MIGRATIONS_DIR)) {
      if (!file.endsWith(".sql")) continue;
      if (file <= lastGatewayMigration) continue;
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
        latestFile: "20260818012310_inbox_producers_gateway_deploy.sql",
      },
      {
        fn: "public.record_loan_payment",
        latestFile:
          "20260820052850_transactions_financial_integrity_gate_09p0.sql",
      },
      {
        fn: "public.detect_matured_savings",
        latestFile: "20260818012310_inbox_producers_gateway_deploy.sql",
      },
      {
        fn: "public.enqueue_savings_maturity_cascade",
        latestFile: "20260818012310_inbox_producers_gateway_deploy.sql",
      },
      {
        fn: "public.reallocate_jar_capacity",
        latestFile: "20260818012310_inbox_producers_gateway_deploy.sql",
      },
    ];

    for (const producer of producers) {
      const sql = readFileSync(
        `${MIGRATIONS_DIR}/${producer.latestFile}`,
        "utf8",
      );
      const functionSql = extractFunctionBlock(sql, producer.fn);
      liveProducerCalls.push({
        file: producer.latestFile,
        fn: producer.fn,
        usesGateway: /produce_inbox_item/.test(functionSql),
        directInsert: /insert\s+into\s+public\.inbox_items/i.test(functionSql),
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
      `${MIGRATIONS_DIR}/20260817224939_inbox_producer_gateway.sql`,
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
      `${MIGRATIONS_DIR}/20260817224939_inbox_producer_gateway.sql`,
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

  it("13D gateway applies per-kind reopen policy and cycle-scoped dedupe", () => {
    const sql = readFileSync(
      `${MIGRATIONS_DIR}/20260818002352_inbox_integration_hardening.sql`,
      "utf8",
    );
    // Per-kind refresh conditions.
    expect(sql).toContain("status in (''pending'', ''expired'')");
    expect(sql).toContain("emi_complete");
    // Cycle-scoped dedupe for savings kinds.
    expect(sql).toContain("cycleId");
    expect(sql).toContain("v_cycle_key");
  });

  it("18B adds one stable Loan/Debt attention identity and source resolution", () => {
    const sql = readFileSync(
      `${MIGRATIONS_DIR}/20260824022207_inbox_loan_debt_attention_18b.sql`,
      "utf8",
    );
    expect(sql).toContain("loan_payment_attention");
    expect(sql).toContain("debt_payment_attention");
    expect(sql).toContain("loan-payment-attention");
    expect(sql).toContain("debt-payment-attention");
    expect(sql).toContain("resolved_by_source_condition");
    expect(sql).toContain("sync_loan_debt_attention_inbox");
  });
});
