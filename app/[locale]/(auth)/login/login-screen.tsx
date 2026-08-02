"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react";
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
import { AuthTextField, CheckboxField } from "@/shared/ui/form";
import {
  AuthBrandMark,
  AuthScreenShell,
  DividerWithText,
  SocialButton,
} from "@/shared/patterns";
import { loginAction, startOAuthAction } from "./actions";

const REMEMBER_KEY = "vinha.auth.rememberEmail";

const loginFormSchema = signInInputSchema.extend({
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

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
    setValue,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setValue("email", saved);
        setValue("remember", true);
      }
    } catch {
      /* ignore */
    }
  }, [setValue]);

  const busy = isPending || oauthPending !== null;
  const remember = useWatch({ control, name: "remember" });

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
      try {
        if (values.remember) {
          window.localStorage.setItem(REMEMBER_KEY, values.email.trim());
        } else {
          window.localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        /* ignore */
      }

      const payload: SignInInput = {
        email: values.email,
        password: values.password,
      };
      const result = await loginAction(payload);
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
    <AuthScreenShell testId="auth-login" centered withGlow>
      <div className="flex flex-col items-center gap-(--space-3) text-center">
        <AuthBrandMark />
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

      <div className="flex flex-col gap-(--space-3)">
        <SocialButton
          provider="google"
          isDisabled={busy}
          data-testid="oauth-google"
          onPress={() => onOAuth("google")}
        >
          {oauthPending === "google"
            ? t("oauthContinuing")
            : t("continueGoogle")}
        </SocialButton>
        <SocialButton
          provider="apple"
          isDisabled={busy}
          data-testid="oauth-apple"
          onPress={() => onOAuth("apple")}
        >
          {oauthPending === "apple" ? t("oauthContinuing") : t("continueApple")}
        </SocialButton>
      </div>

      <DividerWithText>{t("continueWithEmail")}</DividerWithText>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-(--space-4)"
        noValidate
      >
        <AuthTextField
          id="login-email"
          label={t("emailLabel")}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          startIcon={<EnvelopeSimple size={20} weight="regular" />}
          registration={register("email")}
          error={errors.email ? tValidation("invalidEmail") : undefined}
        />
        <AuthTextField
          id="login-password"
          label={t("passwordLabel")}
          type="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          startIcon={<LockSimple size={20} weight="regular" />}
          revealable
          revealShowLabel={t("showPassword")}
          revealHideLabel={t("hidePassword")}
          registration={register("password")}
          error={errors.password ? tValidation("required") : undefined}
        />

        <div className="flex items-center justify-between gap-(--space-3)">
          <CheckboxField
            id="login-remember"
            label={t("remember")}
            checked={Boolean(remember)}
            onChange={(e) => setValue("remember", e.target.checked)}
            className="flex-1"
          />
          <Link
            href="/forgot-password"
            className="shrink-0 text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("forgot")}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="min-h-14 w-full rounded-[var(--radius-lg)] text-base font-semibold"
          isDisabled={busy}
        >
          {isPending && !oauthPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Text tone="muted" size="sm" className="text-center">
        {t("registerPrompt")}{" "}
        <Link
          href="/register"
          className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("register")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
