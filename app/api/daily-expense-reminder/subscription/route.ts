import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { isTrustedSameOriginMutation } from "@/modules/tenancy/application/assert-same-origin-mutation";
import { HTTP_STATUS } from "@/modules/tenancy/application/auth-constants";
import {
  EXPENSE_REMINDER_COOKIE,
  EXPENSE_REMINDER_DEVICE_ACTION,
  EXPENSE_REMINDER_OPERATION,
} from "@/modules/ledger/application/expense-reminder-constants";
import { expenseReminderDeviceRequestSchema } from "@/modules/ledger/application/expense-reminder-schema";
import {
  isDailyExpenseReminderDeviceEnabled,
  removeDailyExpenseReminderSubscription,
  saveDailyExpenseReminderSubscription,
} from "@/modules/ledger/application/daily-expense-reminder";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isTrustedSameOriginMutation(request)) {
    return NextResponse.json(null, { status: HTTP_STATUS.FORBIDDEN });
  }

  let rawRequest: unknown;
  try {
    rawRequest = await request.json();
  } catch (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SUBSCRIPTION,
      phase: "parseRequest",
      error,
    });
    return NextResponse.json(null, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const parsed = expenseReminderDeviceRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    return NextResponse.json(null, { status: HTTP_STATUS.BAD_REQUEST });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(null, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    switch (parsed.data.action) {
      case EXPENSE_REMINDER_DEVICE_ACTION.STATUS: {
        const enabled = await isDailyExpenseReminderDeviceEnabled(
          user.id,
          parsed.data.endpoint,
        );
        return NextResponse.json({ enabled });
      }
      case EXPENSE_REMINDER_DEVICE_ACTION.SUBSCRIBE: {
        const subscriptionId = await saveDailyExpenseReminderSubscription(
          user.id,
          parsed.data,
        );
        const response = NextResponse.json({ enabled: true });
        response.cookies.set(
          EXPENSE_REMINDER_COOKIE.DEVICE_SUBSCRIPTION_ID,
          subscriptionId,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: EXPENSE_REMINDER_COOKIE.MAX_AGE_SECONDS,
          },
        );
        return response;
      }
      case EXPENSE_REMINDER_DEVICE_ACTION.UNSUBSCRIBE: {
        const removed = await removeDailyExpenseReminderSubscription(
          user.id,
          parsed.data.endpoint,
        );
        if (!removed) {
          return NextResponse.json(null, {
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          });
        }
        const response = NextResponse.json({ enabled: false });
        response.cookies.set(
          EXPENSE_REMINDER_COOKIE.DEVICE_SUBSCRIPTION_ID,
          "",
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 0,
          },
        );
        return response;
      }
    }
  } catch (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SUBSCRIPTION,
      error,
    });
    return NextResponse.json(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
