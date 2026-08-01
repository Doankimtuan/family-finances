import { type NextRequest } from "next/server";
import { updateSession } from "@/modules/platform/supabase/update-session";

/**
 * Next.js 16 proxy — refreshes Supabase auth cookies on matched requests.
 * Do not import archive/legacy-v1.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
