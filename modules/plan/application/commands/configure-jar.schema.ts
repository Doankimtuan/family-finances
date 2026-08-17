import { z } from "zod";
import {
  JarKind,
  JarPlanKind,
  JAR_KIND_VALUES,
  JAR_PLAN_KIND_VALUES,
  JAR_ROLLOVER_MODE_VALUES,
} from "../plan-constants";

/** Required category id list shape shared by selection + reassignment confirmation. */
export const jarCategoryIdsSchema = z.array(z.string().uuid()).max(100);

/** Field-level issue codes emitted by the schema's cross-field rules. */
export const JAR_CONFIGURATION_ISSUE_CODE = {
  PERCENT_REQUIRED: "percent_required",
  FIXED_REQUIRED: "fixed_required",
  REASSIGN_CATEGORY_NOT_SELECTED: "reassign_category_not_selected",
} as const;

/**
 * Client-safe Zod schema for Create Jar / Edit Jar configuration.
 * Kept out of the server command module so client barrels stay free of `server-only`.
 */
export const jarConfigurationInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    kind: z.enum(JAR_KIND_VALUES).default(JarKind.SPENDING),
    enabled: z.boolean().default(true),
    planKind: z.enum(JAR_PLAN_KIND_VALUES).default(JarPlanKind.FIXED),
    /** Whole percent 0–100; stored as basis points. */
    percent: z.number().finite().gt(0).lte(100).optional(),
    fixedAmount: z.number().finite().int().gt(0).optional(),
    rolloverMode: z.enum(JAR_ROLLOVER_MODE_VALUES).optional(),
    categoryIds: jarCategoryIdsSchema.default([]),
    /** Required when selected categories already belong to another Jar. */
    confirmReassignCategoryIds: jarCategoryIdsSchema.default([]),
    /** Edit-only destination for categories removed from the current Jar. */
    removedCategoryTargetJarId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.planKind === JarPlanKind.PERCENT && value.percent === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: JAR_CONFIGURATION_ISSUE_CODE.PERCENT_REQUIRED,
        path: ["percent"],
      });
    }
    if (
      value.planKind === JarPlanKind.FIXED &&
      value.fixedAmount === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: JAR_CONFIGURATION_ISSUE_CODE.FIXED_REQUIRED,
        path: ["fixedAmount"],
      });
    }
    const categoryIds = new Set(value.categoryIds);
    for (const categoryId of value.confirmReassignCategoryIds) {
      if (!categoryIds.has(categoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: JAR_CONFIGURATION_ISSUE_CODE.REASSIGN_CATEGORY_NOT_SELECTED,
          path: ["confirmReassignCategoryIds"],
        });
        break;
      }
    }
  });

export type JarConfigurationInput = z.infer<typeof jarConfigurationInputSchema>;
