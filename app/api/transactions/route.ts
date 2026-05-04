import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") ?? null;
    const limit = Number(searchParams.get("limit") ?? "20");

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get household ID
    const { data: member } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    const householdId = member.household_id;

    // Build query
    let query = supabase
      .from("transactions")
      .select(`
        id,
        type,
        amount,
        transaction_date,
        description,
        category_id,
        account_id,
        counterparty_account_id,
        transaction_subtype,
        is_non_cash,
        created_at,
        categories!inner(id, name, kind),
        accounts!inner(id, name),
        counterparty_accounts!inner(id, name),
        household_members!inner(id, name)
      `)
      .eq("household_id", householdId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    // Apply cursor if provided
    if (cursor) {
      const [cursorDate, cursorCreatedAt] = cursor.split("|");
      query = query
        .lt("transaction_date", cursorDate)
        .or(`and(transaction_date.eq.${cursorDate},created_at.lt.${cursorCreatedAt})`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    // Determine if there's a next page
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    // Build next cursor from the last item
    let nextCursor = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = `${lastItem.transaction_date}|${lastItem.created_at}`;
    }

    // Transform data to match the component's expected format
    const transformedItems = items.map((item: any) => ({
      id: item.id,
      type: item.type,
      amount: item.amount,
      transaction_date: item.transaction_date,
      description: item.description,
      category_id: item.category_id,
      account_id: item.account_id,
      counterparty_account_id: item.counterparty_account_id,
      category_name: item.categories?.name ?? null,
      account_name: item.accounts?.name ?? null,
      counterparty_account_name: item.counterparty_accounts?.name ?? null,
      member_name: item.household_members?.name ?? null,
      transaction_subtype: item.transaction_subtype,
      is_non_cash: item.is_non_cash,
    }));

    return NextResponse.json({
      items: transformedItems,
      nextCursor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
