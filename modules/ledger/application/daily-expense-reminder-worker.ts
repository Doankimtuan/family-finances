import "server-only";
import webpush from "web-push";
import englishSettings from "@/messages/en/settings.json";
import vietnameseSettings from "@/messages/vi/settings.json";
import { APP_LOCALE, type AppLocale } from "@/i18n/routing";
import { createSupabaseAdminClient } from "@/modules/platform/supabase/admin";
import { APP_PATH } from "@/modules/shared-kernel/app-path";
import {
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_TIMEZONE_UTC_OFFSET_MINUTES,
} from "@/modules/tenancy/application/tenancy-constants";
import { todayIsoDate } from "@/shared/utils/iso-date";
import {
  EXPENSE_REMINDER_CRON,
  EXPENSE_REMINDER_DATABASE,
  EXPENSE_REMINDER_ENV,
  EXPENSE_REMINDER_INVALID_SUBSCRIPTION_STATUS,
  EXPENSE_REMINDER_OPERATION,
  EXPENSE_REMINDER_SEND_RESULT,
} from "./expense-reminder-constants";

const invalidSubscriptionStatuses = new Set<number>(
  EXPENSE_REMINDER_INVALID_SUBSCRIPTION_STATUS,
);

type PreferenceRow = { user_id: string; reminder_time: string };
type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
  last_sent_on: string | null;
};
type MembershipRow = { user_id: string; household_id: string };
type HouseholdRow = { id: string; locale: string };
type DispatchResult = {
  attempted: number;
  removed: number;
};
type ClaimResult =
  (typeof EXPENSE_REMINDER_SEND_RESULT)[keyof typeof EXPENSE_REMINDER_SEND_RESULT];

export async function dispatchDailyExpenseReminders(
  now = new Date(),
): Promise<DispatchResult> {
  const admin = createSupabaseAdminClient();
  const vapidPublicKey = process.env[EXPENSE_REMINDER_ENV.VAPID_PUBLIC_KEY];
  const vapidPrivateKey = process.env[EXPENSE_REMINDER_ENV.VAPID_PRIVATE_KEY];
  const vapidSubject = process.env[EXPENSE_REMINDER_ENV.VAPID_SUBJECT];

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error("Expense reminder VAPID configuration is missing");
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const today = todayIsoDate(now);
  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: EXPENSE_REMINDER_CRON.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const { data: preferenceData, error: preferenceError } = await admin
    .from(EXPENSE_REMINDER_DATABASE.PREFERENCES_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.PREFERENCE_SELECT)
    .eq(EXPENSE_REMINDER_DATABASE.REMINDER_TIME, currentTime)
    .overrideTypes<PreferenceRow[]>();
  if (preferenceError) throw preferenceError;

  const preferences = preferenceData ?? [];
  if (preferences.length === 0) return { attempted: 0, removed: 0 };

  const userIds = [...new Set(preferences.map(({ user_id }) => user_id))];
  const { data: subscriptionData, error: subscriptionError } = await admin
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_SELECT)
    .in(EXPENSE_REMINDER_DATABASE.USER_ID, userIds)
    .overrideTypes<SubscriptionRow[]>();
  if (subscriptionError) throw subscriptionError;

  const { data: membershipData, error: membershipError } = await admin
    .from(EXPENSE_REMINDER_DATABASE.HOUSEHOLD_MEMBERS_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.MEMBERSHIP_SELECT)
    .eq(EXPENSE_REMINDER_DATABASE.IS_ACTIVE, true)
    .in(EXPENSE_REMINDER_DATABASE.USER_ID, userIds)
    .overrideTypes<MembershipRow[]>();
  if (membershipError) throw membershipError;

  const memberships = membershipData ?? [];
  const householdIds = [
    ...new Set(memberships.map(({ household_id }) => household_id)),
  ];
  if (householdIds.length === 0) return { attempted: 0, removed: 0 };

  const { data: householdData, error: householdError } = await admin
    .from(EXPENSE_REMINDER_DATABASE.HOUSEHOLDS_TABLE)
    .select(EXPENSE_REMINDER_DATABASE.HOUSEHOLD_SELECT)
    .in(EXPENSE_REMINDER_DATABASE.ID, householdIds)
    .overrideTypes<HouseholdRow[]>();
  if (householdError) throw householdError;

  const householdLocales = new Map(
    (householdData ?? []).map(({ id, locale }) => [id, locale]),
  );
  const userLocales = new Map<string, AppLocale>();
  for (const membership of memberships) {
    userLocales.set(
      membership.user_id,
      householdLocales.get(membership.household_id) ===
        HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
        ? APP_LOCALE.VIETNAMESE
        : APP_LOCALE.ENGLISH,
    );
  }

  const results = await Promise.all(
    (subscriptionData ?? []).map((subscription) => {
      if (subscription.last_sent_on === today) {
        return EXPENSE_REMINDER_SEND_RESULT.SKIPPED;
      }
      const locale = userLocales.get(subscription.user_id);
      if (!locale) return EXPENSE_REMINDER_SEND_RESULT.SKIPPED;
      return claimAndSend({ admin, subscription, today, locale, now });
    }),
  );

  return {
    attempted: results.filter(
      (result) => result === EXPENSE_REMINDER_SEND_RESULT.CLAIMED,
    ).length,
    removed: results.filter(
      (result) => result === EXPENSE_REMINDER_SEND_RESULT.REMOVED,
    ).length,
  };
}

async function claimAndSend({
  admin,
  subscription,
  today,
  locale,
  now,
}: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  subscription: SubscriptionRow;
  today: string;
  locale: AppLocale;
  now: Date;
}): Promise<ClaimResult> {
  const sentTodayFilter = [
    `${EXPENSE_REMINDER_DATABASE.LAST_SENT_ON}.is.null`,
    `${EXPENSE_REMINDER_DATABASE.LAST_SENT_ON}.lt.${today}`,
  ].join(",");
  const { data: claim, error: claimError } = await admin
    .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
    .update({ [EXPENSE_REMINDER_DATABASE.LAST_SENT_ON]: today })
    .eq(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID, subscription.id)
    .eq(EXPENSE_REMINDER_DATABASE.USER_ID, subscription.user_id)
    .or(sentTodayFilter)
    .select(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID)
    .maybeSingle();

  if (claimError) {
    console.error({
      operation: EXPENSE_REMINDER_OPERATION.DISPATCH,
      subscriptionId: subscription.id,
      phase: "claim",
      error: claimError,
    });
    return EXPENSE_REMINDER_SEND_RESULT.SKIPPED;
  }
  if (!claim) return EXPENSE_REMINDER_SEND_RESULT.SKIPPED;

  const copy =
    locale === APP_LOCALE.VIETNAMESE
      ? vietnameseSettings.account.expenseReminder
      : englishSettings.account.expenseReminder;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_secret,
        },
      },
      JSON.stringify({
        title: copy.pushTitle,
        body: copy.pushBody,
        url: `/${locale}${APP_PATH.MONEY_ADD}`,
      }),
      { TTL: secondsUntilVietnamMidnight(now) },
    );
    return EXPENSE_REMINDER_SEND_RESULT.CLAIMED;
  } catch (error) {
    const statusCode = webPushStatusCode(error);
    if (statusCode !== null && invalidSubscriptionStatuses.has(statusCode)) {
      const { error: removeError } = await admin
        .from(EXPENSE_REMINDER_DATABASE.SUBSCRIPTIONS_TABLE)
        .delete()
        .eq(EXPENSE_REMINDER_DATABASE.SUBSCRIPTION_ID, subscription.id);
      if (removeError) {
        console.error({
          operation: EXPENSE_REMINDER_OPERATION.REMOVE_SUBSCRIPTION,
          subscriptionId: subscription.id,
          error: removeError,
        });
        return EXPENSE_REMINDER_SEND_RESULT.SKIPPED;
      }
      return EXPENSE_REMINDER_SEND_RESULT.REMOVED;
    }

    console.error({
      operation: EXPENSE_REMINDER_OPERATION.DISPATCH,
      subscriptionId: subscription.id,
      statusCode,
      error,
    });
    return EXPENSE_REMINDER_SEND_RESULT.CLAIMED;
  }
}

function secondsUntilVietnamMidnight(now: Date): number {
  const [year, month, day] = todayIsoDate(now).split("-").map(Number);
  const utcMidnight =
    Date.UTC(year, month - 1, day + 1) -
    HOUSEHOLD_TIMEZONE_UTC_OFFSET_MINUTES.VIETNAM * 60 * 1000;
  return Math.max(1, Math.floor((utcMidnight - now.getTime()) / 1000));
}

function webPushStatusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return null;
  }
  return typeof error.statusCode === "number" ? error.statusCode : null;
}
