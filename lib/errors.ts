/**
 * Custom error classes for standardized error handling
 */

/** Base application error with optional cause and metadata */
export class AppError extends Error {
  public readonly cause?: Error;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    options?: { cause?: Error; metadata?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "AppError";
    this.cause = options?.cause;
    this.metadata = options?.metadata;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/** Validation error for form/field validation failures */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      cause?: Error;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(message, options);
    this.name = "ValidationError";
    this.field = options?.field;
    this.value = options?.value;
  }
}

/** Authentication/authorization error */
export class AuthError extends AppError {
  public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "SESSION_EXPIRED";

  constructor(
    message: string,
    code: "UNAUTHORIZED" | "FORBIDDEN" | "SESSION_EXPIRED",
    options?: { cause?: Error; metadata?: Record<string, unknown> }
  ) {
    super(message, options);
    this.name = "AuthError";
    this.code = code;
  }
}

/** Network/API error */
export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      endpoint?: string;
      cause?: Error;
      metadata?: Record<string, unknown>;
    }
  ) {
    super(message, options);
    this.name = "NetworkError";
    this.statusCode = options?.statusCode;
    this.endpoint = options?.endpoint;
  }
}

/** Type guard to check if error is an AppError */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Type guard to check if error is a ValidationError */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/** Type guard to check if error is an AuthError */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/** Extract user-friendly message from any error */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/** Extract error info for logging (sensitive data should be filtered) */
export function getErrorInfo(error: unknown): {
  name: string;
  message: string;
  cause?: string;
  metadata?: Record<string, unknown>;
} {
  if (isAppError(error)) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause?.message,
      metadata: error.metadata,
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
  };
}
