import { HOUSEHOLD_TIMEZONE } from "@/modules/tenancy/application/tenancy-constants";

export const EXPENSE_REMINDER_TIME_VALUES = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
] as const;

export type ExpenseReminderTime = (typeof EXPENSE_REMINDER_TIME_VALUES)[number];

export const EXPENSE_REMINDER_DEFAULT_TIME: ExpenseReminderTime = "20:00";

export const EXPENSE_REMINDER_DEVICE_ACTION = {
  STATUS: "status",
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
} as const;

export const EXPENSE_REMINDER_DEVICE_STATE = {
  CHECKING: "checking",
  DISABLED: "disabled",
  ENABLED: "enabled",
  DENIED: "denied",
  UNSUPPORTED: "unsupported",
  CONFIGURATION_MISSING: "configurationMissing",
  ERROR: "error",
} as const;

export const EXPENSE_REMINDER_NOTIFICATION_PERMISSION = {
  GRANTED: "granted",
  DENIED: "denied",
  DEFAULT: "default",
} as const;

export const EXPENSE_REMINDER_CLIENT_OPERATION = {
  CHECK_DEVICE: "expenseReminder.checkDevice",
  SUBSCRIBE: "expenseReminder.subscribe",
  UNSUBSCRIBE: "expenseReminder.unsubscribe",
} as const;

export const EXPENSE_REMINDER_FORM_FIELD_ID = "daily-expense-reminder-time";

export const EXPENSE_REMINDER_SEND_RESULT = {
  CLAIMED: "claimed",
  REMOVED: "removed",
  SKIPPED: "skipped",
} as const;

export const EXPENSE_REMINDER_DATABASE = {
  PREFERENCES_TABLE: "daily_expense_reminder_preferences",
  SUBSCRIPTIONS_TABLE: "daily_expense_reminder_subscriptions",
  USER_ID: "user_id",
  REMINDER_TIME: "reminder_time",
  ENDPOINT: "endpoint",
  SUBSCRIPTION_ID: "id",
  LAST_SENT_ON: "last_sent_on",
  P256DH: "p256dh",
  AUTH_SECRET: "auth_secret",
  HOUSEHOLD_MEMBERS_TABLE: "household_members",
  HOUSEHOLDS_TABLE: "households",
  HOUSEHOLD_ID: "household_id",
  HOUSEHOLD_LOCALE: "locale",
  IS_ACTIVE: "is_active",
  ID: "id",
  PREFERENCE_SELECT: "user_id, reminder_time",
  SUBSCRIPTION_SELECT:
    "id, user_id, endpoint, p256dh, auth_secret, last_sent_on",
  MEMBERSHIP_SELECT: "user_id, household_id",
  HOUSEHOLD_SELECT: "id, locale",
} as const;

export const EXPENSE_REMINDER_PUSH_FIELD = {
  ENDPOINT: "endpoint",
  KEYS: "keys",
  P256DH: "p256dh",
  AUTH: "auth",
} as const;

export const EXPENSE_REMINDER_ENV = {
  VAPID_PUBLIC_KEY: "NEXT_PUBLIC_DAILY_EXPENSE_REMINDER_VAPID_PUBLIC_KEY",
  VAPID_PRIVATE_KEY: "DAILY_EXPENSE_REMINDER_VAPID_PRIVATE_KEY",
  VAPID_SUBJECT: "DAILY_EXPENSE_REMINDER_VAPID_SUBJECT",
  CRON_SECRET: "DAILY_EXPENSE_REMINDER_CRON_SECRET",
} as const;

export const EXPENSE_REMINDER_COOKIE = {
  DEVICE_SUBSCRIPTION_ID: "daily-expense-reminder-device-id",
  MAX_AGE_SECONDS: 31_536_000,
} as const;

export const EXPENSE_REMINDER_CRON = {
  TIMEZONE: HOUSEHOLD_TIMEZONE.VIETNAM,
  SCHEDULE_UTC: "0,30 11-15 * * *",
  VAULT_APP_URL_NAME: "daily_expense_reminder_app_url",
  VAULT_SECRET_NAME: "daily_expense_reminder_cron_secret",
  JOB_NAME: "daily_expense_reminder_dispatch",
} as const;

export const EXPENSE_REMINDER_PUSH = {
  SERVICE_WORKER_PATH: "/sw.js",
  APPLE_HOST: "web.push.apple.com",
  FIREFOX_HOST: "updates.push.services.mozilla.com",
  CHROME_HOST: "fcm.googleapis.com",
  MICROSOFT_HOST_SUFFIX: ".notify.windows.com",
} as const;

export const EXPENSE_REMINDER_OPERATION = {
  READ_SETTINGS: "expenseReminder.readSettings",
  SAVE_SETTINGS: "expenseReminder.saveSettings",
  SAVE_SUBSCRIPTION: "expenseReminder.saveSubscription",
  REMOVE_SUBSCRIPTION: "expenseReminder.removeSubscription",
  DISPATCH: "expenseReminder.dispatch",
} as const;

export const EXPENSE_REMINDER_INVALID_SUBSCRIPTION_STATUS = [404, 410] as const;
