"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Mail01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  signInInputSchema,
  type SignInInput,
} from "@/modules/tenancy/application/sign-in.schema";
import type { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";
import { isSafeInAppNextPath } from "@/modules/tenancy/application/auth-redirect";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { AUTH_STORAGE_KEY } from "@/modules/tenancy/application/auth-constants";
import { AlertVariant } from "@/shared/ui/alert";
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
import { loginAction } from "./actions";
import { useStatusAlert } from "@/providers/status-alert-provider";
import {
  authConfirmRedirectUrl,
  startBrowserOAuthSignIn,
} from "@/modules/tenancy/application/start-browser-oauth-sign-in";

const loginFormSchema = signInInputSchema.extend({
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const subscribeToHydration = (onStoreChange: () => void) => {
  queueMicrotask(onStoreChange);
  return () => undefined;
};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export function LoginScreen() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const statusAlert = useStatusAlert();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

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
      const saved = window.localStorage.getItem(
        AUTH_STORAGE_KEY.REMEMBER_EMAIL,
      );
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
          description: t(`errors.${result.code}`),
        });
      }
      // On success the browser navigates to the IdP; keep pending UI until unload.
    });
  };

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    startTransition(async () => {
      try {
        if (values.remember) {
          window.localStorage.setItem(
            AUTH_STORAGE_KEY.REMEMBER_EMAIL,
            values.email.trim(),
          );
        } else {
          window.localStorage.removeItem(AUTH_STORAGE_KEY.REMEMBER_EMAIL);
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
        const next = searchParams.get("next");
        if (next && isSafeInAppNextPath(next)) {
          router.replace(next);
        } else {
          router.replace(result.next);
        }
        router.refresh();
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
    <AuthScreenShell testId="auth-login" align="start" withGlow>
      <AuthScreenHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref={APP_PATH.WELCOME}
      />

      <div className="flex flex-col gap-(--space-3)">
        <SocialButton
          provider="google"
          isDisabled={busy || !hydrated}
          data-testid="oauth-google"
          onPress={() => onOAuth("google")}
        >
          {oauthPending === "google"
            ? t("oauthContinuing")
            : t("continueGoogle")}
        </SocialButton>
        <SocialButton
          provider="apple"
          isDisabled={busy || !hydrated}
          data-testid="oauth-apple"
          onPress={() => onOAuth("apple")}
        >
          {oauthPending === "apple" ? t("oauthContinuing") : t("continueApple")}
        </SocialButton>
      </div>

      <DividerWithText>{t("continueWithEmail")}</DividerWithText>

      <form
        method="post"
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
          startIcon={<AppIcon icon={Mail01Icon} size="sm" />}
          registration={register("email")}
          error={errors.email ? tValidation("invalidEmail") : undefined}
        />
        <AuthTextField
          id="login-password"
          label={t("passwordLabel")}
          type="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          startIcon={<AppIcon icon={LockPasswordIcon} size="sm" />}
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
            href={APP_PATH.FORGOT_PASSWORD}
            className="shrink-0 text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t("forgot")}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="min-h-14 w-full rounded-(--radius-card) text-base font-semibold"
          isDisabled={busy || !hydrated}
        >
          {isPending && !oauthPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <Text tone="muted" size="sm" className="text-center">
        {t("registerPrompt")}{" "}
        <Link
          href={APP_PATH.REGISTER}
          className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("register")}
        </Link>
      </Text>
    </AuthScreenShell>
  );
}
