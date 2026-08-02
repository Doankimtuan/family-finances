import type { NextRequest } from "next/server";
import { HTTP_HEADER } from "./auth-constants";

/**
 * CSRF gate for cookie-mutating auth adapters (e.g. sign-out).
 * Requires Origin or Referer to match the request origin.
 */
export function isTrustedSameOriginMutation(request: NextRequest): boolean {
  const requestOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get(HTTP_HEADER.ORIGIN);

  if (originHeader) {
    return originHeader === requestOrigin;
  }

  const refererHeader = request.headers.get(HTTP_HEADER.REFERER);
  if (!refererHeader) {
    return false;
  }

  try {
    return new URL(refererHeader).origin === requestOrigin;
  } catch {
    return false;
  }
}
