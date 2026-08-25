import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inbox18cRows } from "../fixtures/inbox-18c";
import { mapInboxRow } from "@/modules/inbox/application/mappers/inbox-item.mapper";
import { InboxEnrichmentState } from "@/modules/inbox/application/inbox-constants";

describe("Inbox 18C queue hardening", () => {
  it("has a stable synthetic multi-page fixture with independent read state", () => {
    const rows = inbox18cRows();
    expect(rows).toHaveLength(75);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(rows.some((row) => row.read_at == null)).toBe(true);
    expect(rows.some((row) => row.read_at != null)).toBe(true);
    expect(mapInboxRow(rows[0]!)?.lifecycleDate).toBe("2026-08-24");
  });

  it("uses bounded keyset reads and never slices an unbounded queue", () => {
    const source = readFileSync(
      "modules/inbox/application/queries/review-items.ts",
      "utf8",
    );
    const pageSource = source.slice(
      source.indexOf("async function loadOpenInboxPage"),
    );
    expect(pageSource).toContain("INBOX_OPEN_PAGE_SIZE + 1");
    expect(pageSource).toContain("created_at.lt.");
    expect(pageSource).toContain("id.lt.");
    expect(pageSource).toContain('.order("id", { ascending: false })');
    expect(pageSource).not.toContain(".range(0, 999999");
    expect(source).toContain('.is("read_at", null)');
    expect(source).toContain('.select("id", { count: "exact", head: true })');
  });

  it("keeps read actions independent from lifecycle status and idempotent", () => {
    const source = readFileSync(
      "modules/inbox/application/commands/review-items.ts",
      "utf8",
    );
    expect(source).toContain(".update({ read_at: readAt })");
    expect(source).toContain("setInboxReadState");
    expect(source).toContain(
      "return setInboxReadState(\n    parsed.data.inboxItemId,\n    null",
    );
    expect(source).not.toContain("status: InboxItemStatus.PENDING");
  });

  it("maps a failed linked source to an unavailable, readable state", () => {
    const item = mapInboxRow(inbox18cRows(1)[0]!, undefined, undefined, true);
    expect(item).toMatchObject({
      enrichmentState: InboxEnrichmentState.UNAVAILABLE,
      readAt: null,
      lifecycleDate: "2026-08-24",
    });
  });
});
