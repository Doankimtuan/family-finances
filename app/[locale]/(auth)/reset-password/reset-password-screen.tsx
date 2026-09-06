"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Link, useRouter } from "@/i18n/navigation";
import { PASSWORD_MIN_LENGTH } from "@/modules/tenancy/application/auth-constants";
import {
  updatePasswordInputSchema,
  type UpdatePasswordInput,
} from "@/modules/tenancy/application/update-password.schema";
import { AlertVariant } from "@/shared/ui/alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { AuthTextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { AuthScreenHeader, AuthScreenShell } from "@/shared/patterns";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { updatePasswordAction } from "./actions";

export function ResetPasswordScreen() {
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const statusAlert = useStatusAlert();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordInputSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await updatePasswordAction(values);
      if (result.status === "success") {
        router.replace(result.next);
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("errorTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  });

  return (
    <AuthScreenShell testId="auth-reset-password" align="start">
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
          id="reset-password"
          label={t("passwordLabel")}
          description={t("passwordHint")}
          type="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          startIcon={<AppIcon icon={LockPasswordIcon} size="sm" />}
          revealable
          revealShowLabel={t("showPassword")}
          revealHideLabel={t("hidePassword")}
          registration={register("password")}
          error={
            errors.password
              ? tValidation("tooShort", { min: PASSWORD_MIN_LENGTH })
              : undefined
          }
        />
        <AuthTextField
          id="reset-confirm-password"
          label={t("confirmPasswordLabel")}
          type="password"
          autoComplete="new-password"
          placeholder={t("confirmPasswordPlaceholder")}
          startIcon={<AppIcon icon={LockPasswordIcon} size="sm" />}
          revealable
          revealShowLabel={t("showPassword")}
          revealHideLabel={t("hidePassword")}
          registration={register("confirmPassword")}
          error={
            errors.confirmPassword ? tValidation("passwordMismatch") : undefined
          }
        />
        <Button
          type="submit"
          variant="primary"
          className="min-h-14 w-full rounded-(--radius-control) text-base font-semibold"
          isDisabled={isPending}
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Text tone="muted" size="sm" className="text-center">
        <Link
          href={APP_PATH.LOGIN}
          className="min-h-11 content-center text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToLogin")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
