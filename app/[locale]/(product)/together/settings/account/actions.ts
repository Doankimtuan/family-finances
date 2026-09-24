"use server";

import { getSessionUser } from "@/modules/tenancy/application/get-session-user";
import {
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
} from "@/modules/tenancy/application/product-action-error";
import { EXPENSE_REMINDER_OPERATION } from "@/modules/ledger/application/expense-reminder-constants";
import { saveDailyExpenseReminderTime } from "@/modules/ledger/application/daily-expense-reminder";
import { expenseReminderTimeSchema } from "@/modules/ledger/application/expense-reminder-schema";

export type SaveExpenseReminderTimeResult =
  | { status: typeof ProductActionStatus.SUCCESS }
  | {
      status: typeof ProductActionStatus.ERROR;
      code:
        | typeof PRODUCT_ACTION_ERROR_CODE.INVALID
        | typeof PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED
        | typeof PRODUCT_ACTION_ERROR_CODE.UNKNOWN;
    };

export async function saveExpenseReminderTimeAction(
  input: unknown,
): Promise<SaveExpenseReminderTimeResult> {
  const parsed = expenseReminderTimeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED,
    };
  }

  try {
    const saved = await saveDailyExpenseReminderTime(user.id, parsed.data);
    return saved
      ? { status: ProductActionStatus.SUCCESS }
      : {
          status: ProductActionStatus.ERROR,
          code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
        };
  } catch (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SETTINGS,
      userId: user.id,
      error,
    });
    return {
      status: ProductActionStatus.ERROR,
      code: PRODUCT_ACTION_ERROR_CODE.UNKNOWN,
    };
  }
}
