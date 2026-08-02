"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { LoadingState } from "@/shared/patterns/loading-state";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";

export function ConfirmScreen({
  status,
  code,
}: {
  status: "error" | "ok" | "pending";
  code?: string;
}) {
  const t = useTranslations("auth.confirm");
  const router = useRouter();

  if (status === "pending") {
    return (
      <AuthScreenShell testId="auth-confirm" centered className="items-center">
        <Heading level={1} className="text-xl">
          {t("title")}
        </Heading>
        <LoadingState label={t("loadingLabel")} className="py-0" />
      </AuthScreenShell>
    );
  }

  if (status === "ok") {
    return (
      <AuthScreenShell testId="auth-confirm" centered>
        <StatusAlert
          variant="success"
          title={t("successTitle")}
          description={t("successDescription")}
        />
        <Button
          variant="primary"
          className="w-full"
          onPress={() => router.replace("/home")}
        >
          {t("continue")}
        </Button>
      </AuthScreenShell>
    );
  }

  const errorKey =
    code === "unconfigured" || code === "invalid" || code === "unknown"
      ? code
      : "invalid";

  return (
    <AuthScreenShell testId="auth-confirm" centered>
      <StatusAlert
        variant="danger"
        title={t("errorTitle")}
        description={t(`errors.${errorKey}`)}
      />
      <Button
        variant="primary"
        className="w-full"
        onPress={() => router.replace("/login")}
      >
        {t("continue")}
      </Button>
    </AuthScreenShell>
  );
}
