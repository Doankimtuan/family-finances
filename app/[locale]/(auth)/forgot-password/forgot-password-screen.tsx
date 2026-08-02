"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  forgotPasswordInputSchema,
  type ForgotPasswordInput,
} from "@/modules/tenancy/application/register.schema";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { TextField } from "@/shared/ui/form";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { BrandMark } from "@/shared/patterns/brand-mark";
import { toast } from "@/shared/patterns/toast";
import { forgotPasswordAction } from "./actions";
import {
  AUTH_LOCALE_LOGIN_SEGMENT,
  buildAuthConfirmAdapterUrl,
} from "@/modules/tenancy/application/auth-constants";

export function ForgotPasswordScreen() {
  const t = useTranslations("auth.forgotPassword");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<
    "unconfigured" | "invalid" | "unknown" | null
  >(null);

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
    setErrorCode(null);
    startTransition(async () => {
      const result = await forgotPasswordAction({
        ...values,
        redirectTo: buildAuthConfirmAdapterUrl(
          window.location.origin,
          `/${AUTH_LOCALE_LOGIN_SEGMENT}`,
        ),
      });
      if (result.status === "success") {
        toast.success(t("toastSent"));
        reset();
        return;
      }
      if (result.status === "error") {
        setErrorCode(result.code);
      }
    });
  });

  return (
    <AuthScreenShell testId="auth-forgot-password" centered>
      <div className="flex flex-col items-center gap-(--space-3) text-center">
        <BrandMark variant="soft" size="md" />
        <div className="flex flex-col gap-(--space-2)">
          <Heading level={2} className="tracking-tight">
            {t("title")}
          </Heading>
          <Text tone="secondary" size="sm" className="leading-relaxed">
            {t("subtitle")}
          </Text>
        </div>
      </div>

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-(--space-4)"
        noValidate
      >
        <TextField
          id="forgot-email"
          label={t("emailLabel")}
          type="email"
          autoComplete="email"
          registration={register("email")}
          error={errors.email ? tValidation("invalidEmail") : undefined}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isDisabled={isPending}
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Text tone="muted" size="sm" className="text-center">
        <Link
          href="/login"
          className="min-h-11 content-center text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("backToLogin")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
