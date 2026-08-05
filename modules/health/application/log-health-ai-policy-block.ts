import "server-only";

import { recordAiAuditEvent } from "@/modules/platform/application/ai-audit";
import {
  AiAuditEventKind,
  AI_AUDIT_SURFACE,
} from "@/modules/platform/application/ai-audit.schema";
import type { HealthPolicyBlock } from "./build-health-insights";

/**
 * Persist BR-14 policy blocks from Health insight generation (ST-E06-002).
 */
export async function logHealthAiPolicyBlock(
  block: HealthPolicyBlock,
): Promise<void> {
  await recordAiAuditEvent({
    kind: AiAuditEventKind.POLICY_BLOCK,
    surface: AI_AUDIT_SURFACE.HEALTH_INSIGHTS,
    payload: {
      target: block.target,
      kind: block.kind,
      code: block.code,
    },
  });
}
