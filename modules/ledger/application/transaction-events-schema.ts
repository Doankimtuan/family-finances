import { z } from "zod";
import {
  MAX_TRANSACTION_TAGS,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_CURSOR_MAX_LENGTH,
  TRANSACTION_SEARCH_MAX_LENGTH,
  TransactionFilterType,
} from "./ledger-constants";

const transactionFilterIdsSchema = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").filter(Boolean) : []))
  .pipe(z.array(z.uuid()));

export const transactionEventFilterSchema = z
  .object({
    type: z
      .enum(TRANSACTION_COMMON_FILTER_OPTIONS)
      .default(TransactionFilterType.ALL),
    account: z.uuid().optional(),
    tags: z
      .string()
      .optional()
      .transform((value) => (value ? value.split(",").filter(Boolean) : []))
      .pipe(z.array(z.uuid()).max(MAX_TRANSACTION_TAGS)),
    q: z.string().trim().max(TRANSACTION_SEARCH_MAX_LENGTH).optional(),
    category: transactionFilterIdsSchema,
    jar: transactionFilterIdsSchema,
    cursor: z.string().max(TRANSACTION_CURSOR_MAX_LENGTH).optional(),
  })
  .transform(({ tags, category, jar, account, ...filters }) => ({
    ...filters,
    accountId: account,
    tagIds: [...new Set(tags)],
    categoryIds: [...new Set(category)],
    jarIds: [...new Set(jar)],
  }));

export type TransactionEventFilterInput = z.input<
  typeof transactionEventFilterSchema
>;
export type TransactionEventFilters = z.output<
  typeof transactionEventFilterSchema
>;
