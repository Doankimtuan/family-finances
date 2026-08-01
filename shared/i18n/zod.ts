import { z } from "zod";

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

/**
 * Locale-aware Zod error map using `validation` / `errors` namespaces.
 * Pass `t` from `useTranslations('validation')` or server `getTranslations`.
 *
 * @example
 * const t = await getTranslations('validation');
 * z.config({ customError: createZodErrorMap(t) }); // zod v4 style varies — see developer guide
 */
export function createZodErrorMap(t: TranslateFn) {
  return (issue: z.core.$ZodIssue) => {
    switch (issue.code) {
      case "invalid_type":
        if (issue.input === undefined) {
          return t("required");
        }
        return t("invalidType");
      case "too_small":
        if (issue.origin === "string") {
          return t("tooShort", { min: issue.minimum });
        }
        return t("required");
      case "too_big":
        if (issue.origin === "string") {
          return t("tooLong", { max: issue.maximum });
        }
        return t("invalidType");
      case "invalid_format":
        if (issue.format === "email") {
          return t("invalidEmail");
        }
        return t("invalidType");
      default:
        return t("invalidType");
    }
  };
}

/**
 * Sample schema factory for DX — not a production form.
 * Demonstrates RHF + Zod + localized messages wiring.
 */
export function createSampleEmailSchema(t: TranslateFn) {
  return z.object({
    email: z
      .string({ error: () => t("required") })
      .min(1, { error: () => t("required") })
      .email({ error: () => t("invalidEmail") }),
  });
}
