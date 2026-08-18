/**
 * Canonical household ownership vocabulary (Prompt 14A contract).
 *
 * Every financial ownership root (accounts, savings, investment_holdings,
 * loans, liabilities, goals) carries the same pair:
 *   financial_scope       'household' | 'personal'   (default 'household')
 *   owner_membership_id   household_members.id, NULL iff scope = household
 *
 * All other financial rows inherit ownership from their parent resource.
 * This is a household-level contract, not a per-domain permission framework —
 * ownership semantics are shared, enforcement lives in each domain (14C/14D).
 */

export const FINANCIAL_SCOPE = {
  HOUSEHOLD: "household",
  PERSONAL: "personal",
} as const;

export type FinancialScope =
  (typeof FINANCIAL_SCOPE)[keyof typeof FINANCIAL_SCOPE];

export const FINANCIAL_SCOPE_VALUES = Object.values(FINANCIAL_SCOPE);

export function isFinancialScope(value: string): value is FinancialScope {
  return (FINANCIAL_SCOPE_VALUES as readonly string[]).includes(value);
}

/**
 * The DB column names are canonical and shared by every ownership root.
 * Domains reference these (e.g. in select projections) rather than restating
 * the literal column names with possible drift.
 */
export const FINANCIAL_SCOPE_COLUMN = "financial_scope" as const;
export const OWNER_MEMBERSHIP_ID_COLUMN = "owner_membership_id" as const;
