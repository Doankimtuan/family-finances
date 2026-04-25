"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
    <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
            mode === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <FormField
          label="Email"
          htmlFor="email"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <Button
          type="submit"
          disabled={pending}
          className="w-full py-6 text-base"
        >
          {pending
            ? "Please wait..."
            : mode === "login"
              ? "Log In"
              : "Create Account"}
        </Button>
      </form>

      {activeState.status === "error" && activeState.message ? (
        <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
          {activeState.message}
        </p>
      ) : null}

      {activeState.status === "success" && activeState.message ? (
        <p className="mt-4 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success animate-in fade-in slide-in-from-top-1">
          {activeState.message}
        </p>
      ) : null}
    </div>
  );
}
