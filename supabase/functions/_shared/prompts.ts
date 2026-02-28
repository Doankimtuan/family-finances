import type { InsightFunctionType, PromptVersion } from "./types.ts";

function stringifyContext(context: Record<string, unknown>): string {
  return JSON.stringify(context, null, 2);
}

export function buildPrompt(
  functionType: InsightFunctionType,
  promptVersion: PromptVersion,
  context: Record<string, unknown>,
): { systemInstruction: string; userPrompt: string } {
  const outputContract = JSON.stringify(promptVersion.output_contract);
  const guardrails = JSON.stringify(promptVersion.guardrails);

  const common = [
    "[CONTEXT BLOCK]",
    stringifyContext(context),
    "",
    "[TASK INSTRUCTION]",
    promptVersion.task_instruction,
    "",
    "[OUTPUT CONTRACT]",
    outputContract,
    "",
    "[GUARDRAILS]",
    guardrails,
    "",
    "Bắt buộc: trả lời bằng tiếng Việt, không dùng markdown, chỉ trả JSON hợp lệ.",
  ].join("\n");

  if (functionType === "monthly_review") {
    return {
      systemInstruction: `${promptVersion.role_frame} Chỉ sử dụng dữ liệu đã cung cấp, không suy diễn ngoài dữ liệu.`,
      userPrompt: `${common}\n\nJSON phải có đúng các trường: title, summary, wins, risks, action. Trường action phải là đúng 1 hành động cụ thể trong 7 ngày tới.`,
    };
  }

  if (functionType === "goal_risk_coach") {
    return {
      systemInstruction: `${promptVersion.role_frame} Tập trung vào mục tiêu có rủi ro cao nhất và tính khả thi trong 1 tuần.`,
      userPrompt: `${common}\n\nJSON phải có đúng các trường: title, risk_reason, impact, action. Trường action chỉ có 1 hành động và phải định lượng được nếu có số liệu.`,
    };
  }

  return {
    systemInstruction: `${promptVersion.role_frame} Giữ giọng điệu bình tĩnh, không đổ lỗi, ưu tiên hành động dễ làm.`,
    userPrompt: `${common}\n\nJSON phải có đúng các trường: title, what_changed, drivers, action. Trường drivers là mảng tối đa 2 mục. Trường action chỉ có 1 hành động tuần này.`,
  };
}
