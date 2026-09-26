import { NextResponse, type NextRequest } from "next/server";
import {
  listTransactionEvents,
  transactionEventFilterSchema,
} from "@/modules/ledger/application";
import { HTTP_STATUS } from "@/modules/tenancy/application/auth-constants";
import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import { resolveActiveMembership } from "@/modules/tenancy/application/resolve-active-membership";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = transactionEventFilterSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(null, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(null, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const membership = await resolveActiveMembership(user.id);
  if (!membership) {
    return NextResponse.json(null, { status: HTTP_STATUS.FORBIDDEN });
  }

  const result = await listTransactionEvents(parsed.data);
  if (!result) {
    return NextResponse.json(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
  return NextResponse.json(result);
}
