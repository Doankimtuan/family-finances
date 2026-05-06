"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Lock, Mail, Sparkles } from "lucide-react";
import { useActionState, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  loginAction,
  signUpAction,
  type AuthActionState,
} from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/providers/i18n-provider";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type AuthFormValues = z.infer<typeof authSchema>;

type Mode = "login" | "signup";

const initialAuthActionState: AuthActionState = {
  status: "idle",
  message: "",
};

export function LoginForm({ origin }: { origin: string }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginFormAction] = useActionState<
    AuthActionState,
    FormData
  >(loginAction, initialAuthActionState);
  const [signupState, signupFormAction] = useActionState<
    AuthActionState,
    FormData
  >(signUpAction, initialAuthActionState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: "onBlur",
  });

  const activeState = useMemo(
    () => (mode === "login" ? loginState : signupState),
    [loginState, mode, signupState],
  );

  const modeCopy = useMemo(
    () =>
      mode === "login"
        ? {
            title: t("login.welcome_back"),
            description: t("login.welcome_back_desc"),
            toggleHint: t("login.toggle_login"),
            submitLabel: t("login.login"),
            pendingLabel: t("login.signing_in"),
          }
        : {
            title: t("login.create_access"),
            description: t("login.create_access_desc"),
            toggleHint: t("login.toggle_signup"),
            submitLabel: t("login.signup"),
            pendingLabel: t("login.creating_account"),
          },
    [mode, t],
  );

  const onSubmit = handleSubmit((values) => {
    const payload = new FormData();
    payload.set("email", values.email);
    payload.set("password", values.password);
    payload.set("origin", origin);

    startTransition(() => {
      if (mode === "login") {
        loginFormAction(payload);
      } else {
        signupFormAction(payload);
      }
    });
  });

  const pending = isPending || isSubmitting;

  return (
    <div className="w-full rounded-3xl border border-border/70 bg-card/95 p-5 shadow-xl shadow-foreground/5 sm:p-6">
      <div className="mb-6 space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("login.household_access")}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {modeCopy.title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {modeCopy.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("login")}
            aria-pressed={mode === "login"}
            className="h-10 w-full rounded-xl text-sm font-semibold"
          >
            {t("login.login")}
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
            className="h-10 w-full rounded-xl text-sm font-semibold"
          >
            {t("login.signup")}
          </Button>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {modeCopy.toggleHint}
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <FormField
          label={t("login.email")}
          htmlFor="email"
          error={errors.email?.message}
          description={t("login.email_desc")}
          required
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={t("login.email_placeholder")}
              aria-invalid={!!errors.email}
              className="h-12 bg-background pl-10 text-base shadow-sm transition-shadow focus-visible:shadow-[0_0_0_4px_hsl(var(--ring)/0.12)]"
              {...register("email")}
            />
          </div>
        </FormField>

        <FormField
          label={t("login.password")}
          htmlFor="password"
          error={errors.password?.message}
          description={t("login.password_desc")}
          required
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={t("login.password_placeholder")}
              aria-invalid={!!errors.password}
              className="h-12 bg-background pl-10 text-base shadow-sm transition-shadow focus-visible:shadow-[0_0_0_4px_hsl(var(--ring)/0.12)]"
              {...register("password")}
            />
          </div>
        </FormField>

        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="w-full shadow-md shadow-primary/15"
        >
          {pending ? modeCopy.pendingLabel : modeCopy.submitLabel}
        </Button>
      </form>

      {activeState.status === "error" && activeState.message ? (
        <div
          className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium leading-6">{activeState.message}</p>
        </div>
      ) : null}

      {activeState.status === "success" && activeState.message ? (
        <div
          className="mt-4 flex items-start gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success animate-in fade-in slide-in-from-top-1"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium leading-6">{activeState.message}</p>
        </div>
      ) : null}
    </div>
  );
}
