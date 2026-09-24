"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { APP_API_PATH } from "@/modules/shared-kernel/app-path";
import {
  EXPENSE_REMINDER_DEVICE_ACTION,
  EXPENSE_REMINDER_DEVICE_STATE,
  EXPENSE_REMINDER_CLIENT_OPERATION,
  EXPENSE_REMINDER_FORM_FIELD_ID,
  EXPENSE_REMINDER_NOTIFICATION_PERMISSION,
  EXPENSE_REMINDER_PUSH,
  EXPENSE_REMINDER_TIME_VALUES,
  type ExpenseReminderTime,
} from "@/modules/ledger/application/expense-reminder-constants";
import type { ExpenseReminderDeviceRequest } from "@/modules/ledger/application/expense-reminder-schema";
import { expenseReminderTimeSchema } from "@/modules/ledger/application/expense-reminder-schema";
import { APP_LOCALE } from "@/i18n/routing";
import { formatTime } from "@/shared/i18n/formatters";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { AlertVariant } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { SelectField } from "@/shared/ui/form/select-field";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { saveExpenseReminderTimeAction } from "./actions";
import { ProductActionStatus } from "@/modules/tenancy/application/product-action-error";

type DeviceState =
  (typeof EXPENSE_REMINDER_DEVICE_STATE)[keyof typeof EXPENSE_REMINDER_DEVICE_STATE];

export function DailyExpenseReminderSettings({
  initialTime,
  vapidPublicKey,
}: {
  initialTime: ExpenseReminderTime;
  vapidPublicKey: string | null;
}) {
  const t = useTranslations("settings.account.expenseReminder");
  const locale = useLocale();
  const [time, setTime] = useState(initialTime);
  const [deviceState, setDeviceState] = useState<DeviceState>(
    EXPENSE_REMINDER_DEVICE_STATE.CHECKING,
  );
  const [settingsSaveFailed, setSettingsSaveFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function checkDevice() {
      if (!hasPushSupport()) {
        setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.UNSUPPORTED);
        return;
      }
      if (!vapidPublicKey) {
        setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.CONFIGURATION_MISSING);
        return;
      }
      if (
        Notification.permission ===
        EXPENSE_REMINDER_NOTIFICATION_PERMISSION.DENIED
      ) {
        setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.DENIED);
        return;
      }
      if (
        Notification.permission !==
        EXPENSE_REMINDER_NOTIFICATION_PERMISSION.GRANTED
      ) {
        setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.DISABLED);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) {
          if (!cancelled) {
            setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.DISABLED);
          }
          return;
        }

        const enabled = await postDeviceRequest({
          action: EXPENSE_REMINDER_DEVICE_ACTION.STATUS,
          endpoint: subscription.endpoint,
        });
        if (!cancelled) {
          setDeviceState(
            enabled === true
              ? EXPENSE_REMINDER_DEVICE_STATE.ENABLED
              : enabled === false
                ? EXPENSE_REMINDER_DEVICE_STATE.DISABLED
                : EXPENSE_REMINDER_DEVICE_STATE.ERROR,
          );
        }
      } catch (error) {
        console.error({
          operation: EXPENSE_REMINDER_CLIENT_OPERATION.CHECK_DEVICE,
          error,
        });
        if (!cancelled) setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.ERROR);
      }
    }

    void checkDevice();
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  const timeOptions = EXPENSE_REMINDER_TIME_VALUES.map((value) => ({
    id: value,
    label: formatReminderTime(value, locale),
  }));

  const onTimeChange = (value: string) => {
    const parsed = expenseReminderTimeSchema.safeParse(value);
    if (!parsed.success || parsed.data === time) return;

    setSettingsSaveFailed(false);
    startTransition(async () => {
      const result = await saveExpenseReminderTimeAction(parsed.data);
      if (result.status === ProductActionStatus.SUCCESS) {
        setTime(parsed.data);
        return;
      }
      setSettingsSaveFailed(true);
    });
  };

  const onDeviceAction = () => {
    if (deviceState === EXPENSE_REMINDER_DEVICE_STATE.ENABLED) {
      startTransition(async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription =
            await registration?.pushManager.getSubscription();
          if (!subscription) {
            setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.DISABLED);
            return;
          }
          const result = await postDeviceRequest({
            action: EXPENSE_REMINDER_DEVICE_ACTION.UNSUBSCRIBE,
            endpoint: subscription.endpoint,
          });
          if (result === false) {
            await subscription?.unsubscribe();
            setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.DISABLED);
            return;
          }
          setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.ERROR);
        } catch (error) {
          console.error({
            operation: EXPENSE_REMINDER_CLIENT_OPERATION.UNSUBSCRIBE,
            error,
          });
          setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.ERROR);
        }
      });
      return;
    }

    if (!hasPushSupport()) {
      setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.UNSUPPORTED);
      return;
    }
    if (!vapidPublicKey) {
      setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.CONFIGURATION_MISSING);
      return;
    }

    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== EXPENSE_REMINDER_NOTIFICATION_PERMISSION.GRANTED) {
          setDeviceState(
            permission === EXPENSE_REMINDER_NOTIFICATION_PERMISSION.DENIED
              ? EXPENSE_REMINDER_DEVICE_STATE.DENIED
              : EXPENSE_REMINDER_DEVICE_STATE.DISABLED,
          );
          return;
        }

        const registration = await navigator.serviceWorker.register(
          EXPENSE_REMINDER_PUSH.SERVICE_WORKER_PATH,
        );
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidPublicKey(vapidPublicKey),
          });
        }

        const json = subscription.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
          setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.ERROR);
          return;
        }
        const enabled = await postDeviceRequest({
          action: EXPENSE_REMINDER_DEVICE_ACTION.SUBSCRIBE,
          subscription: {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          },
        });
        setDeviceState(
          enabled === true
            ? EXPENSE_REMINDER_DEVICE_STATE.ENABLED
            : EXPENSE_REMINDER_DEVICE_STATE.ERROR,
        );
      } catch (error) {
        console.error({
          operation: EXPENSE_REMINDER_CLIENT_OPERATION.SUBSCRIBE,
          error,
        });
        setDeviceState(EXPENSE_REMINDER_DEVICE_STATE.ERROR);
      }
    });
  };

  return (
    <section className="flex flex-col gap-(--space-3)">
      <SectionHeader title={t("title")} description={t("description")} />
      <Card tone="elevated" className="gap-(--space-4) p-(--space-4)">
        <SelectField
          id={EXPENSE_REMINDER_FORM_FIELD_ID}
          label={t("timeLabel")}
          value={time}
          onChange={onTimeChange}
          options={timeOptions}
          isDisabled={isPending}
          data-testid="daily-expense-reminder-time"
        />
        {settingsSaveFailed ? (
          <StatusAlert variant={AlertVariant.DANGER} title={t("error")} />
        ) : null}
        <StatusAlert
          variant={
            deviceState === EXPENSE_REMINDER_DEVICE_STATE.ERROR
              ? AlertVariant.DANGER
              : AlertVariant.INFO
          }
          title={deviceStatusMessage(deviceState, t)}
        />
        <Text size="xs" tone="secondary" className="text-pretty">
          {t("iosTip")}
        </Text>
        <Button
          variant="secondary"
          onPress={onDeviceAction}
          isDisabled={
            isPending ||
            deviceState === EXPENSE_REMINDER_DEVICE_STATE.CHECKING ||
            deviceState ===
              EXPENSE_REMINDER_DEVICE_STATE.CONFIGURATION_MISSING ||
            deviceState === EXPENSE_REMINDER_DEVICE_STATE.UNSUPPORTED ||
            deviceState === EXPENSE_REMINDER_DEVICE_STATE.DENIED
          }
        >
          {deviceState === EXPENSE_REMINDER_DEVICE_STATE.ENABLED
            ? t("disable")
            : t("enable")}
        </Button>
      </Card>
    </section>
  );
}

function deviceStatusMessage(
  state: DeviceState,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (state) {
    case EXPENSE_REMINDER_DEVICE_STATE.CHECKING:
      return t("checking");
    case EXPENSE_REMINDER_DEVICE_STATE.ENABLED:
      return t("enabledStatus");
    case EXPENSE_REMINDER_DEVICE_STATE.DENIED:
      return t("permissionDenied");
    case EXPENSE_REMINDER_DEVICE_STATE.UNSUPPORTED:
      return t("unsupported");
    case EXPENSE_REMINDER_DEVICE_STATE.CONFIGURATION_MISSING:
      return t("configurationMissing");
    case EXPENSE_REMINDER_DEVICE_STATE.ERROR:
      return t("error");
    case EXPENSE_REMINDER_DEVICE_STATE.DISABLED:
      return t("disabledStatus");
  }
}

function hasPushSupport(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator,
  );
}

function decodeVapidPublicKey(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = window.atob(padded);
  const buffer = new ArrayBuffer(decoded.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return buffer;
}

async function postDeviceRequest(
  request: ExpenseReminderDeviceRequest,
): Promise<boolean | null> {
  const response = await fetch(APP_API_PATH.EXPENSE_REMINDER_SUBSCRIPTION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) return null;

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("enabled" in result) ||
    typeof result.enabled !== "boolean"
  ) {
    return null;
  }
  return result.enabled;
}

function formatReminderTime(
  value: ExpenseReminderTime,
  locale: string,
): string {
  const [hour, minute] = value.split(":");
  return formatTime(
    Date.UTC(2000, 0, 1, Number(hour), Number(minute)),
    locale === APP_LOCALE.VIETNAMESE
      ? APP_LOCALE.VIETNAMESE
      : APP_LOCALE.ENGLISH,
    { timeZone: "UTC" },
  );
}
