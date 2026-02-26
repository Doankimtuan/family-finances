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

function SubmitButton({ pending, mode }: { pending: boolean; mode: Mode }) {
  const label = mode === "login" ? "Log In" : "Create Account";

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait..." : label}
    </button>
  );
}

export function LoginForm({ origin }: { origin: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginFormAction] = useActionState<AuthActionState, FormData>(
    loginAction,
    initialAuthActionState,
  );
  const [signupState, signupFormAction] = useActionState<AuthActionState, FormData>(
    signUpAction,
    initialAuthActionState,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: "onBlur",
  });

  const activeState = useMemo(() => (mode === "login" ? loginState : signupState), [
    loginState,
    mode,
    signupState,
  ]);

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
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500"
            placeholder="At least 8 characters"
            {...register("password")}
          />
          {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        <SubmitButton pending={pending} mode={mode} />
      </form>

      {activeState.status === "error" && activeState.message ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {activeState.message}
        </p>
      ) : null}

      {activeState.status === "success" && activeState.message ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {activeState.message}
        </p>
      ) : null}
    </div>
  );
}
