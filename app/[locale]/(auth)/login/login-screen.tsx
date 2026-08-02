"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  signInInputSchema,
  type SignInInput,
} from "@/modules/tenancy/application/sign-in.schema";
import type { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { Heading } from "@/shared/ui/heading";
import { Divider } from "@/shared/ui/divider";
import { TextField } from "@/shared/ui/form";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { loginAction, startOAuthAction } from "./actions";

type LoginFormValues = SignInInput;

type LoginErrorCode =
  | "unconfigured"
  | "invalid_credentials"
  | "invalid"
  | "provider_error"
  | "unknown";

function authConfirmRedirectUrl(): string {
  return `${window.location.origin}/auth/confirm`;
}

export function LoginScreen() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const [errorCode, setErrorCode] = useState<LoginErrorCode | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: "", password: "" },
  });

  const busy = isPending || oauthPending !== null;

  const onOAuth = (provider: OAuthProvider) => {
    setErrorCode(null);
    setOauthPending(provider);
    startTransition(async () => {
      const result = await startOAuthAction({
        provider,
        redirectTo: authConfirmRedirectUrl(),
      });
      setOauthPending(null);
      if (result.status === "success") {
        window.location.assign(result.url);
        return;
      }
      if (result.status === "error") {
        setErrorCode(result.code);
      }
    });
  };

  const onSubmit = handleSubmit((values) => {
    setErrorCode(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.status === "success") {
        router.replace("/home");
        router.refresh();
        return;
      }
      if (result.status === "error") {
        setErrorCode(result.code);
      }
    });
  });

  return (
    <AuthScreenShell testId="auth-login" centered>
      <div className="flex flex-col gap-(--space-2)">
        <Heading level={1} className="text-2xl">
          {t("title")}
        </Heading>
        <Text tone="secondary" size="sm">
          {t("subtitle")}
        </Text>
      </div>

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      <div className="flex flex-col gap-(--space-3)">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          isDisabled={busy}
          data-testid="oauth-google"
          onPress={() => onOAuth("google")}
        >
          {oauthPending === "google"
            ? t("oauthContinuing")
            : t("continueGoogle")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          isDisabled={busy}
          data-testid="oauth-apple"
          onPress={() => onOAuth("apple")}
        >
          {oauthPending === "apple" ? t("oauthContinuing") : t("continueApple")}
        </Button>
      </div>

      <div className="flex items-center gap-(--space-3)">
        <Divider className="flex-1" />
        <Text tone="muted" size="sm" className="shrink-0">
          {t("continueWithEmail")}
        </Text>
        <Divider className="flex-1" />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-(--space-4)"
        noValidate
      >
        <TextField
          id="login-email"
          label={t("emailLabel")}
          type="email"
          autoComplete="email"
          registration={register("email")}
          error={errors.email ? tValidation("invalidEmail") : undefined}
        />
        <TextField
          id="login-password"
          label={t("passwordLabel")}
          type="password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password ? tValidation("required") : undefined}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isDisabled={busy}
        >
          {isPending && !oauthPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-(--space-2)">
        <Text tone="muted" size="sm">
          {t("registerPrompt")}{" "}
          <Link
            href="/register"
            className="text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("register")}
          </Link>
        </Text>
        <Link
          href="/forgot-password"
          className="min-h-11 content-center text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("forgot")}
        </Link>
      </div>
    </AuthScreenShell>
  );
}
