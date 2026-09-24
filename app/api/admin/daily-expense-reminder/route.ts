import { dispatchDailyExpenseReminders } from "@/modules/ledger/application/daily-expense-reminder-worker";
import {
  EXPENSE_REMINDER_ENV,
  EXPENSE_REMINDER_OPERATION,
} from "@/modules/ledger/application/expense-reminder-constants";
import { hasAdminSyncSecret } from "@/modules/platform/application/admin-sync-auth";
import { HTTP_STATUS } from "@/modules/tenancy/application/auth-constants";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  if (!hasAdminSyncSecret(request, EXPENSE_REMINDER_ENV.CRON_SECRET)) {
    return Response.json(null, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    return Response.json(await dispatchDailyExpenseReminders());
  } catch (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.DISPATCH,
      error,
    });
    return Response.json(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
