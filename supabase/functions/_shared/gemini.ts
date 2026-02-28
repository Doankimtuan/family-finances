import { AppError } from "./errors.ts";
import { getEnv } from "./env.ts";
import type { GeminiResult } from "./types.ts";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type GeminiPart = { text?: string };
type GeminiCandidate = { content?: { parts?: GeminiPart[] } };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini(input: {
  systemInstruction: string;
  userPrompt: string;
}): Promise<GeminiResult> {
  const env = getEnv();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: input.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof data?.error?.message === "string"
          ? data.error.message
          : `Gemini request failed with status ${response.status}`;

        if (RETRYABLE_STATUSES.has(response.status) && attempt < 3) {
          await sleep(300 * Math.pow(2, attempt));
          continue;
        }

        throw new AppError(message, "UPSTREAM_GEMINI_ERROR", RETRYABLE_STATUSES.has(response.status));
      }

      const text = ((data?.candidates ?? []) as GeminiCandidate[])
        .flatMap((candidate) => candidate?.content?.parts ?? [])
        .map((part) => part?.text ?? "")
        .join("")
        .trim();

      if (!text) {
        throw new AppError("Gemini returned empty content", "UPSTREAM_EMPTY_RESPONSE", true);
      }

      return {
        text,
        usage: {
          inputTokens: data?.usageMetadata?.promptTokenCount,
          outputTokens: data?.usageMetadata?.candidatesTokenCount,
          totalTokens: data?.usageMetadata?.totalTokenCount,
        },
        raw: data,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const retryable = error instanceof AppError ? error.retryable : true;
      if (!retryable || attempt >= 3) break;

      await sleep(300 * Math.pow(2, attempt));
    }
  }

  throw new AppError(lastError?.message ?? "Gemini call failed", "UPSTREAM_GEMINI_ERROR", true);
}

export function parseModelJson<T extends Record<string, unknown>>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new AppError("Model output is not valid JSON", "MODEL_OUTPUT_PARSE_ERROR", false);
  }
}
