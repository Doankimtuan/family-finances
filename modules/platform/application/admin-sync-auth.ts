import { timingSafeEqual } from "node:crypto";

const AUTHORIZATION_HEADER = "authorization";
const BEARER_PREFIX = "Bearer ";

export function hasAdminSyncSecret(
  request: Request,
  environmentVariable: string,
): boolean {
  const expected = process.env[environmentVariable]?.trim();
  const authorization = request.headers.get(AUTHORIZATION_HEADER) ?? "";
  if (!expected || !authorization.startsWith(BEARER_PREFIX)) return false;
  const provided = authorization.slice(BEARER_PREFIX.length);
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return (
    expectedBytes.length === providedBytes.length &&
    timingSafeEqual(expectedBytes, providedBytes)
  );
}
