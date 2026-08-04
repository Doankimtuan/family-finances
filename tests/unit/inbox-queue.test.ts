import { describe, expect, it } from "vitest";
import { InboxItemKind } from "@/modules/inbox/application/inbox-constants";
import { inboxItemPath } from "@/modules/tenancy/application/app-path";

describe("inbox queue helpers (ST-E06-001)", () => {
  it("builds inbox detail path", () => {
    expect(inboxItemPath("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "/inbox/550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("keeps ReviewItem kind constants for filter chips", () => {
    expect(InboxItemKind.UNMAPPED_EXPENSE).toBe("unmapped_expense");
    expect(InboxItemKind.INCOME_SUGGEST).toBe("income_suggest");
    expect(InboxItemKind.EMERGENCY_DECLARATION).toBe("emergency_declaration");
  });
});
