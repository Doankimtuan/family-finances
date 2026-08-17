import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/tenancy/application/ai-audit", () => ({
  recordAiAuditEvent: vi.fn(),
}));

import { recordAiAuditEvent } from "@/modules/tenancy/application/ai-audit";
import {
  AiAuditEventKind,
  AI_AUDIT_SURFACE,
} from "@/modules/tenancy/application/ai-audit.schema";
import { AI_POLICY_ERROR_CODE } from "@/modules/platform/application/ai-policy";
import { logHealthAiPolicyBlock } from "@/modules/health/application/log-health-ai-policy-block";

describe("logHealthAiPolicyBlock (ST-E06-002 / B3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records POLICY_BLOCK audit events for Health insights", async () => {
    vi.mocked(recordAiAuditEvent).mockResolvedValue({ ok: true, id: "log-1" });

    await logHealthAiPolicyBlock({
      target: "insight",
      kind: "activity",
      code: AI_POLICY_ERROR_CODE.UNGROUNDED_PARAMS,
    });

    expect(recordAiAuditEvent).toHaveBeenCalledWith({
      kind: AiAuditEventKind.POLICY_BLOCK,
      surface: AI_AUDIT_SURFACE.HEALTH_INSIGHTS,
      payload: {
        target: "insight",
        kind: "activity",
        code: AI_POLICY_ERROR_CODE.UNGROUNDED_PARAMS,
      },
    });
  });
});
