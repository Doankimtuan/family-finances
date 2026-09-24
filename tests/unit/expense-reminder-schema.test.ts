import {
  EXPENSE_REMINDER_DEVICE_ACTION,
  EXPENSE_REMINDER_PUSH,
  EXPENSE_REMINDER_TIME_VALUES,
} from "@/modules/ledger/application/expense-reminder-constants";
import {
  expenseReminderDeviceRequestSchema,
  expenseReminderTimeSchema,
} from "@/modules/ledger/application/expense-reminder-schema";

describe("daily expense reminder validation", () => {
  it("accepts every offered time and rejects values outside the evening slots", () => {
    expect(
      EXPENSE_REMINDER_TIME_VALUES.every(
        (time) => expenseReminderTimeSchema.safeParse(time).success,
      ),
    ).toBe(true);
    expect(expenseReminderTimeSchema.safeParse("17:59").success).toBe(false);
    expect(expenseReminderTimeSchema.safeParse("23:00").success).toBe(false);
  });

  it("accepts a supported push endpoint and rejects arbitrary HTTPS endpoints", () => {
    const supported = expenseReminderDeviceRequestSchema.safeParse({
      action: EXPENSE_REMINDER_DEVICE_ACTION.STATUS,
      endpoint: `https://${EXPENSE_REMINDER_PUSH.CHROME_HOST}/push/test`,
    });
    const arbitrary = expenseReminderDeviceRequestSchema.safeParse({
      action: EXPENSE_REMINDER_DEVICE_ACTION.STATUS,
      endpoint: "https://attacker.example/push/test",
    });

    expect(supported.success).toBe(true);
    expect(arbitrary.success).toBe(false);
  });
});
