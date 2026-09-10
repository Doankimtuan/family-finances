"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { LoadingState } from "@/shared/patterns/loading-state";
import {
  AUTH_PRIMARY_ACTION_CLASS_NAME,
  AuthScreenShell,
} from "@/shared/patterns/auth-screen-shell";
import { BrandMark } from "@/shared/patterns/brand-mark";
import {
  isAuthConfirmErrorCode,
  isAuthLinkingConflictCode,
} from "@/modules/tenancy/application/map-auth-linking-error";
import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_STATUS,
  AUTH_LOCALE_HOME_SEGMENT,
  AUTH_LOCALE_LOGIN_SEGMENT,
} from "@/modules/tenancy/application/auth-constants";

export function ConfirmScreen({
  status,
  code,
}: {
  status:
    | typeof AUTH_CONFIRM_STATUS.ERROR
    | typeof AUTH_CONFIRM_STATUS.OK
    | typeof AUTH_CONFIRM_STATUS.PENDING;
  code?: string;
}) {
  const t = useTranslations("auth.confirm");
  const router = useRouter();

  if (status === AUTH_CONFIRM_STATUS.PENDING) {
    return (
      <AuthScreenShell testId="auth-confirm" centered className="items-center">
        <BrandMark variant="soft" size="md" />
        <Heading level={1} className="text-xl tracking-tight">
          {t("title")}
        </Heading>
        <LoadingState label={t("loadingLabel")} className="py-0" />
      </AuthScreenShell>
    );
  }

  if (status === AUTH_CONFIRM_STATUS.OK) {
    return (
      <AuthScreenShell testId="auth-confirm" centered>
        <div className="flex justify-center">
          <BrandMark variant="soft" size="md" />
        </div>
        <StatusAlert
          variant="success"
          title={t("successTitle")}
          description={t("successDescription")}
        />
        <Button
          variant="primary"
          className={AUTH_PRIMARY_ACTION_CLASS_NAME}
          onPress={() => router.replace(`/${AUTH_LOCALE_HOME_SEGMENT}`)}
        >
          {t("continue")}
        </Button>
      </AuthScreenShell>
    );
  }

  const errorKey = isAuthConfirmErrorCode(code)
    ? code
    : AUTH_CONFIRM_ERROR_CODE.INVALID;
  const alertTitle = isAuthLinkingConflictCode(errorKey)
    ? t("conflictTitle")
    : t("errorTitle");

  return (
    <AuthScreenShell testId="auth-confirm" centered>
      <div className="flex justify-center">
        <BrandMark variant="soft" size="md" />
      </div>
      <StatusAlert
        variant="danger"
        title={alertTitle}
        description={t(`errors.${errorKey}`)}
      />
      <Button
        variant="primary"
        className={AUTH_PRIMARY_ACTION_CLASS_NAME}
        onPress={() => router.replace(`/${AUTH_LOCALE_LOGIN_SEGMENT}`)}
      >
        {t("continue")}
      </Button>
    </AuthScreenShell>
  );
}
