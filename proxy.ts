import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/modules/platform/supabase/update-session";

const handleI18nRouting = createMiddleware(routing);

/**
 * Next.js 16 proxy — locale routing (next-intl) then Supabase session refresh.
 */
export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
