import { z } from "zod";
import { PLAN_ACTION_ERROR_CODE } from "../plan-constants";
import { isEmergencyIntentValid } from "../plan-movement-policy";

/**
 * Client-safe Zod schema for jar capacity reallocation (BR-01 / BR-07).
 * Kept out of the server command module so client barrels stay free of `server-only`.
 */
export const reallocateJarCapacityInputSchema = z
  .object({
    sourceJarId: z.string().uuid(),
    targetJarId: z.string().uuid(),
    /** Positive whole currency units of virtual capacity (BR-06). */
    amount: z.number().int().positive(),
    isEmergency: z.boolean().default(false),
    intentNote: z.string().trim().max(280).optional().nullable(),
    /** Client confirms BR-07 warn dialog when required. */
    warningAcknowledged: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.sourceJarId === value.targetJarId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PLAN_ACTION_ERROR_CODE.SAME_JAR,
        path: ["targetJarId"],
      });
    }
    if (
      !isEmergencyIntentValid({
        isEmergency: value.isEmergency,
        intentNote: value.intentNote,
      })
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
        path: ["intentNote"],
      });
    }
  });

export type ReallocateJarCapacityInput = z.infer<
  typeof reallocateJarCapacityInputSchema
>;
