type LoggableContextValue = string | number | boolean | null | undefined;

export type ActionFailureContext = Readonly<
  Record<string, LoggableContextValue>
>;

export function logActionFailure({
  operation,
  error,
  context,
}: {
  operation: string;
  error: unknown;
  context?: ActionFailureContext;
}): void {
  console.error({ operation, error, context });
}
