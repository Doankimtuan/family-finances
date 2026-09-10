"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@/i18n/navigation";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "@/modules/tenancy/application/register.schema";
import { AlertVariant } from "@/shared/ui/alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { AuthTextField } from "@/shared/ui/form";
import {
  AUTH_PRIMARY_ACTION_CLASS_NAME,
  AuthScreenHeader,
  AuthScreenShell,
  authCrossLinkClassName,
} from "@/shared/patterns";
import { toast } from "@/shared/patterns/toast";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { forgotPasswordAction } from "./actions";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { buildAuthConfirmAdapterUrl } from "@/modules/tenancy/application/auth-constants";

export function ForgotPasswordScreen() {
  const t = useTranslations("auth.forgotPassword");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const statusAlert = useStatusAlert();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordInputSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await forgotPasswordAction({
        ...values,
        redirectTo: buildAuthConfirmAdapterUrl(
          window.location.origin,
          APP_PATH.RESET_PASSWORD,
        ),
      });
      if (result.status === "success") {
        toast.success(t("toastSent"));
        reset();
        return;
      }
      if (result.status === "error") {
        statusAlert.show({
          variant: AlertVariant.DANGER,
          title: t("errorTitle"),
          description: t(`errors.${result.code}`),
        });
      }
    });
  });

  return (
    <AuthScreenShell
      testId="auth-forgot-password"
      align="start"
      busy={isPending}
    >
      <AuthScreenHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref={APP_PATH.LOGIN}
        backLabel={t("backToLogin")}
      />

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-(--space-4)"
        noValidate
      >
        <AuthTextField
          id="forgot-email"
          label={t("emailLabel")}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          startIcon={<AppIcon icon={Mail01Icon} size="sm" />}
          registration={register("email")}
          error={errors.email ? tValidation("invalidEmail") : undefined}
        />
        <Button
          type="submit"
          variant="primary"
          className={AUTH_PRIMARY_ACTION_CLASS_NAME}
          isDisabled={isPending}
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Text tone="muted" size="sm" className="text-center">
        <Link href={APP_PATH.LOGIN} className={authCrossLinkClassName()}>
          {t("backToLogin")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
