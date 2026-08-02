"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  registerInputSchema,
  type RegisterInput,
} from "@/modules/tenancy/application/register.schema";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { TextField } from "@/shared/ui/form";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { registerAction } from "./actions";

export function RegisterScreen() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<
    "unconfigured" | "invalid" | "already_registered" | "unknown" | null
  >(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setErrorCode(null);
    setNeedsConfirm(false);
    startTransition(async () => {
      const result = await registerAction({
        ...values,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      });
      if (result.status === "success") {
        if (result.next === "home") {
          router.replace("/home");
          router.refresh();
          return;
        }
        setNeedsConfirm(true);
        return;
      }
      if (result.status === "error") {
        setErrorCode(result.code);
      }
    });
  });

  return (
    <AuthScreenShell testId="auth-register" centered>
      <div className="flex flex-col gap-(--space-2)">
        <Heading level={1} className="text-2xl">
          {t("title")}
        </Heading>
        <Text tone="secondary" size="sm">
          {t("subtitle")}
        </Text>
      </div>

      {needsConfirm ? (
        <StatusAlert
          variant="success"
          title={t("confirmTitle")}
          description={t("confirmDescription")}
        />
      ) : null}

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {!needsConfirm ? (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-(--space-4)"
          noValidate
        >
          <TextField
            id="register-email"
            label={t("emailLabel")}
            type="email"
            autoComplete="email"
            registration={register("email")}
            error={errors.email ? tValidation("invalidEmail") : undefined}
          />
          <TextField
            id="register-password"
            label={t("passwordLabel")}
            type="password"
            autoComplete="new-password"
            registration={register("password")}
            error={
              errors.password ? tValidation("tooShort", { min: 8 }) : undefined
            }
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
      ) : null}

      <Text tone="muted" size="sm" className="text-center">
        {t("loginPrompt")}{" "}
        <Link
          href="/login"
          className="text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("login")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
