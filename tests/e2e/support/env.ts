import { loadEnvConfig } from "@next/env";

export const E2E_ENV_KEY = {
  EMAIL: "E2E_USER_EMAIL",
  PASSWORD: "E2E_USER_PASSWORD",
} as const;

export type E2ECredentials = {
  email: string;
  password: string;
};

export type E2EEnvironmentStatus = {
  envLoaded: boolean;
  emailPresent: boolean;
  passwordPresent: boolean;
};

loadEnvConfig(process.cwd());

function credentialValues(environment: NodeJS.ProcessEnv) {
  return {
    email: environment[E2E_ENV_KEY.EMAIL]?.trim(),
    password: environment[E2E_ENV_KEY.PASSWORD],
  };
}

export function getE2EEnvironmentStatus(
  environment: NodeJS.ProcessEnv = process.env,
): E2EEnvironmentStatus {
  const { email, password } = credentialValues(environment);
  return {
    envLoaded: true,
    emailPresent: Boolean(email),
    passwordPresent: Boolean(password),
  };
}

export function hasE2ECredentials(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const status = getE2EEnvironmentStatus(environment);
  return status.emailPresent && status.passwordPresent;
}

export function assertE2EEnvironmentPolicy(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const status = getE2EEnvironmentStatus(environment);
  if (status.emailPresent !== status.passwordPresent) {
    throw new Error(
      "E2E authentication credentials are partially configured; provide both E2E_USER_EMAIL and E2E_USER_PASSWORD.",
    );
  }
}

export function getE2ECredentials(
  environment: NodeJS.ProcessEnv = process.env,
): E2ECredentials {
  const { email, password } = credentialValues(environment);
  if (!email || !password) {
    throw new Error(
      "E2E authentication credentials are not configured; set E2E_USER_EMAIL and E2E_USER_PASSWORD.",
    );
  }
  return { email, password };
}

export function printE2EEnvironmentDiagnostic(): void {
  const status = getE2EEnvironmentStatus();
  console.error(`E2E env loaded: ${status.envLoaded ? "yes" : "no"}`);
  console.error(
    `E2E_USER_EMAIL present: ${status.emailPresent ? "yes" : "no"}`,
  );
  console.error(
    `E2E_USER_PASSWORD present: ${status.passwordPresent ? "yes" : "no"}`,
  );
}
