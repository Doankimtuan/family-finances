/**
 * AIOS Core Engine — production control plane.
 * No workers. No skill execution. Plan + orchestrate + persist only.
 */

export class AiosError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: { retryable?: boolean; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "AiosError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}

export function isAiosError(error: unknown): error is AiosError {
  return error instanceof AiosError;
}
