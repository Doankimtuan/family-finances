/**
 * Custom hooks for onboarding data fetching
 * Uses react-query for caching and optimistic updates
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface Account {
  id: string;
  name: string;
  type: string;
}

/**
 * Fetch accounts for debt payment selection
 * Excludes credit cards and archived accounts
 */
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name, type")
        .eq("is_archived", false)
        .is("deleted_at", null)
        .neq("type", "credit_card");

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
