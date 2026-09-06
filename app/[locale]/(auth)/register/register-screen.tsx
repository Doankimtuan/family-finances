"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Mail01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Link, useRouter } from "@/i18n/navigation";
import {
  registerInputSchema,
  type RegisterInput,
} from "@/modules/tenancy/application/register.schema";
import type { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";
import { AlertVariant } from "@/shared/ui/alert";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { AuthTextField, CheckboxField } from "@/shared/ui/form";
import { AppIcon } from "@/shared/ui/app-icon";
import {
  AuthScreenHeader,
  AuthScreenShell,
  DividerWithText,
  SocialButton,
} from "@/shared/patterns";
import { registerAction } from "./actions";
import { useStatusAlert } from "@/providers/status-alert-provider";
import {
  authConfirmRedirectUrl,
  startBrowserOAuthSignIn,
} from "@/modules/tenancy/application/start-browser-oauth-sign-in";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  AUTH_ACTION_ERROR_CODE,
  AUTH_SIGN_UP_NEXT,
  PASSWORD_MIN_LENGTH,
  type AuthActionErrorCode,
} from "@/modules/tenancy/application/auth-constants";

const registerFormSchema = registerInputSchema
  .extend({
    confirmPassword: z.string().min(1),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  })
  .refine((data) => data.acceptTerms === true, {
    path: ["acceptTerms"],
    message: "acceptTerms",
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

type OAuthErrorCode = Extract<
  AuthActionErrorCode,
  | typeof AUTH_ACTION_ERROR_CODE.UNCONFIGURED
  | typeof AUTH_ACTION_ERROR_CODE.INVALID
  | typeof AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR
  | typeof AUTH_ACTION_ERROR_CODE.UNKNOWN
>;

function oauthErrorDescription(
  t: (
    key: "oauthProviderError" | "errors.unconfigured" | "errors.unknown",
  ) => string,
  code: OAuthErrorCode,
): string {
  if (
    code === AUTH_ACTION_ERROR_CODE.PROVIDER_ERROR ||
    code === AUTH_ACTION_ERROR_CODE.INVALID
  ) {
    return t("oauthProviderError");
  }
  if (code === AUTH_ACTION_ERROR_CODE.UNCONFIGURED) {
    return t("errors.unconfigured");
  }
  return t("errors.unknown");
}

export function RegisterScreen() {
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const statusAlert = useStatusAlert();
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const busy = isPending || oauthPending !== null;
  const acceptTerms = useWatch({ control, name: "acceptTerms" });

  const onOAuth = (provider: OAuthProvider) => {
    statusAlert.hide();
    setOauthPending(provider);
    startTransition(async () => {
      const result = await startBrowserOAuthSignIn({
        provider,
        redirectTo: authConfirmRedirectUrl(),
      });
      if (!result.ok) {
        setOauthPending(null);
        statusAlert.show({
          variant: AlertVariant.DANGER,
          title: t("errorTitle"),
          description: oauthErrorDescription(t, result.code),
        });
      }
    });
  };

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    setNeedsConfirm(false);
    startTransition(async () => {
      const payload: RegisterInput = {
        email: values.email,
        password: values.password,
      };
      const result = await registerAction({
        ...payload,
        emailRedirectTo: authConfirmRedirectUrl(),
      });
      if (result.status === "success") {
        if (result.next === AUTH_SIGN_UP_NEXT.ONBOARD) {
          router.replace(APP_PATH.ONBOARD);
          router.refresh();
          return;
        }
        setNeedsConfirm(true);
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

  const termsLabel = t.rich("acceptTermsRich", {
    terms: (chunks) => (
      <span className="font-semibold text-accent">{chunks}</span>
    ),
    privacy: (chunks) => (
      <span className="font-semibold text-accent">{chunks}</span>
    ),
  });

  return (
    <AuthScreenShell testId="auth-register" align="start" withGlow>
      <AuthScreenHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref={APP_PATH.WELCOME}
      />

      {needsConfirm ? (
        <StatusAlert
          variant={AlertVariant.SUCCESS}
          title={t("confirmTitle")}
          description={t("confirmDescription")}
        />
      ) : null}

      {!needsConfirm ? (
        <>
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
              {oauthPending === "apple"
                ? t("oauthContinuing")
                : t("continueApple")}
            </SocialButton>
          </div>

          <DividerWithText>{t("continueWithEmail")}</DividerWithText>

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-(--space-4)"
            noValidate
          >
            <AuthTextField
              id="register-email"
              label={t("emailLabel")}
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              startIcon={<AppIcon icon={Mail01Icon} size="sm" />}
              registration={register("email")}
              error={errors.email ? tValidation("invalidEmail") : undefined}
            />
            <AuthTextField
              id="register-password"
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
              id="register-confirm-password"
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
                errors.confirmPassword
                  ? tValidation("passwordMismatch")
                  : undefined
              }
            />

            <CheckboxField
              id="register-terms"
              label={termsLabel}
              checked={Boolean(acceptTerms)}
              onChange={(e) => setValue("acceptTerms", e.target.checked)}
              error={
                errors.acceptTerms ? tValidation("acceptTerms") : undefined
              }
            />

            <Button
              type="submit"
              variant="primary"
              className="min-h-14 w-full rounded-(--radius-control) text-base font-semibold"
              isDisabled={busy}
            >
              {isPending && !oauthPending ? t("submitting") : t("submit")}
            </Button>
          </form>
        </>
      ) : null}

      <Text tone="muted" size="sm" className="text-center">
        {t("loginPrompt")}{" "}
        <Link
          href={APP_PATH.LOGIN}
          className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("login")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
