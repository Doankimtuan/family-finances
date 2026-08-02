import { z } from "zod";
import { createSupabaseServerClient } from "@/modules/platform/supabase/server";
import { assertMoneyActionAllowed } from "@/modules/tenancy/application/assert-money-action-allowed";

export const createAccountInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z
    .enum(["cash", "checking", "savings", "ewallet", "brokerage", "other"])
    .default("cash"),
  openingBalance: z.number().finite().int().default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export type CreateAccountErrorCode =
  "unauthenticated" | "no_membership" | "invalid" | "unknown";

export type CreateAccountResult =
  { ok: true; accountId: string } | { ok: false; code: CreateAccountErrorCode };

/**
 * Create a cash/wallet account for the active household (ledger Real position).
 */
export async function createAccount(
  raw: CreateAccountInput,
): Promise<CreateAccountResult> {
  const parsed = createAccountInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "invalid" };
  }

  const gate = await assertMoneyActionAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      code:
        gate.reason === "unauthenticated" ? "unauthenticated" : "no_membership",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        household_id: gate.householdId,
        name: parsed.data.name,
        type: parsed.data.type,
        opening_balance: parsed.data.openingBalance,
        created_by: gate.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, code: "unknown" };
    }

    return { ok: true, accountId: data.id };
  } catch {
    return { ok: false, code: "unknown" };
  }
}
