import "server-only";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import {
  EXPENSE_REMINDER_DEVICE_ACTION,
  EXPENSE_REMINDER_DATABASE,
  EXPENSE_REMINDER_DEFAULT_TIME,
  EXPENSE_REMINDER_OPERATION,
  type ExpenseReminderTime,
} from "./expense-reminder-constants";
import {
  expenseReminderTimeSchema,
  type ExpenseReminderDeviceRequest,
} from "./expense-reminder-schema";

type PreferenceRow = { reminder_time: string };

export async function getDailyExpenseReminderTime(
  userId: string,
): Promise<ExpenseReminderTime> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.PREFERENCES_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.PREFERENCE_SELECT)
    .eq(EXPENSE_REMINDER_DATABASE.USER_ID, userId)
    .maybeSingle()
    .overrideTypes<PreferenceRow>();

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.READ_SETTINGS,
      userId,
      error,
    });
    throw error;
  }
  if (!data) return EXPENSE_REMINDER_DEFAULT_TIME;

  const time = data.reminder_time.slice(0, 5);
  const parsedTime = expenseReminderTimeSchema.safeParse(time);
  if (!parsedTime.success) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.READ_SETTINGS,
      userId,
      invalidStoredTime: true,
    });
    return EXPENSE_REMINDER_DEFAULT_TIME;
  }
  return parsedTime.data;
}

export async function saveDailyExpenseReminderTime(
  userId: string,
  reminderTime: ExpenseReminderTime,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.PREFERENCES_TABLE)
    .upsert(
      {
        [EXPENSE_REMINDER_DATABASE.USER_ID]: userId,
        [EXPENSE_REMINDER_DATABASE.REMINDER_TIME]: reminderTime,
      },
      { onConflict: EXPENSE_REMINDER_DATABASE.USER_ID },
    );

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SETTINGS,
      userId,
      error,
    });
    return false;
  }
  return true;
}

export async function isDailyExpenseReminderDeviceEnabled(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID)
    .eq(EXPENSE_REMINDER_DATABASE.USER_ID, userId)
    .eq(EXPENSE_REMINDER_DATABASE.ENDPOINT, endpoint)
    .maybeSingle();

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.READ_SETTINGS,
      userId,
      error,
    });
    throw error;
  }
  return Boolean(data);
}

export async function saveDailyExpenseReminderSubscription(
  userId: string,
  request: Extract<
    ExpenseReminderDeviceRequest,
    { action: typeof EXPENSE_REMINDER_DEVICE_ACTION.SUBSCRIBE }
  >,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { error: preferenceError } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.PREFERENCES_TABLE)
    .upsert(
      {
        [EXPENSE_REMINDER_DATABASE.USER_ID]: userId,
        [EXPENSE_REMINDER_DATABASE.REMINDER_TIME]:
          EXPENSE_REMINDER_DEFAULT_TIME,
      },
      {
        onConflict: EXPENSE_REMINDER_DATABASE.USER_ID,
        ignoreDuplicates: true,
      },
    );

  if (preferenceError) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SUBSCRIPTION,
      userId,
      error: preferenceError,
    });
    throw preferenceError;
  }

  const { data, error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .upsert(
      {
        [EXPENSE_REMINDER_DATABASE.USER_ID]: userId,
        [EXPENSE_REMINDER_DATABASE.ENDPOINT]: request.subscription.endpoint,
        [EXPENSE_REMINDER_DATABASE.P256DH]: request.subscription.keys.p256dh,
        [EXPENSE_REMINDER_DATABASE.AUTH_SECRET]: request.subscription.keys.auth,
      },
      {
        onConflict: EXPENSE_REMINDER_DATABASE.ENDPOINT,
      },
    )
    .select(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID)
    .single()
    .overrideTypes<{ id: string }>();

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.SAVE_SUBSCRIPTION,
      userId,
      error,
    });
    throw error;
  }
  return data.id;
}

export async function removeDailyExpenseReminderSubscription(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .delete()
    .eq(EXPENSE_REMINDER_DATABASE.USER_ID, userId)
    .eq(EXPENSE_REMINDER_DATABASE.ENDPOINT, endpoint);

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.REMOVE_SUBSCRIPTION,
      userId,
      error,
    });
    return false;
  }
  return true;
}

export async function removeSignedOutReminderDevice(
  userId: string,
  deviceSubscriptionId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .delete()
    .eq(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID, deviceSubscriptionId)
    .eq(EXPENSE_REMINDER_DATABASE.USER_ID, userId);

  if (error) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.REMOVE_SUBSCRIPTION,
      userId,
      error,
    });
    return false;
  }
  return true;
}
