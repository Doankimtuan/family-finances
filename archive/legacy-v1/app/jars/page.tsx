import { redirect } from "next/navigation";

import { getAuthenticatedHouseholdContext } from "@/lib/server/household";

export const metadata = {
  title: "Jars | Family Finances",
};

export default async function JarsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    month?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const month = params?.month && /^\d{4}-\d{2}$/.test(params.month)
    ? params.month
    : new Date().toISOString().slice(0, 7);

  redirect(`/goals?tab=jars&month=${month}`);
}

