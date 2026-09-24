import { z } from "zod";
import {
  EXPENSE_REMINDER_DEVICE_ACTION,
  EXPENSE_REMINDER_PUSH,
  EXPENSE_REMINDER_PUSH_FIELD,
  EXPENSE_REMINDER_TIME_VALUES,
} from "./expense-reminder-constants";

export const expenseReminderTimeSchema = z.enum(EXPENSE_REMINDER_TIME_VALUES);

const pushEndpointSchema = z
  .string()
  .url()
  .max(2048)
  .refine(isSupportedPushEndpoint);

const pushSubscriptionSchema = z.object({
  [EXPENSE_REMINDER_PUSH_FIELD.ENDPOINT]: pushEndpointSchema,
  [EXPENSE_REMINDER_PUSH_FIELD.KEYS]: z.object({
    [EXPENSE_REMINDER_PUSH_FIELD.P256DH]: z.string().min(1).max(256),
    [EXPENSE_REMINDER_PUSH_FIELD.AUTH]: z.string().min(1).max(128),
  }),
});

export const expenseReminderDeviceRequestSchema = z.discriminatedUnion(
  "action",
  [
    z.object({
      action: z.literal(EXPENSE_REMINDER_DEVICE_ACTION.STATUS),
      endpoint: pushEndpointSchema,
    }),
    z.object({
      action: z.literal(EXPENSE_REMINDER_DEVICE_ACTION.SUBSCRIBE),
      subscription: pushSubscriptionSchema,
    }),
    z.object({
      action: z.literal(EXPENSE_REMINDER_DEVICE_ACTION.UNSUBSCRIBE),
      endpoint: pushEndpointSchema,
    }),
  ],
);

export type ExpenseReminderDeviceRequest = z.infer<
  typeof expenseReminderDeviceRequestSchema
>;

function isSupportedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const isKnownPushHost =
      url.hostname === EXPENSE_REMINDER_PUSH.APPLE_HOST ||
      url.hostname === EXPENSE_REMINDER_PUSH.FIREFOX_HOST ||
      url.hostname === EXPENSE_REMINDER_PUSH.CHROME_HOST ||
      url.hostname.endsWith(EXPENSE_REMINDER_PUSH.MICROSOFT_HOST_SUFFIX);

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      isKnownPushHost
    );
  } catch {
    return false;
  }
}
