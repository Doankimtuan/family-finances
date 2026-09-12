/**
 * Viewport-visible authenticated Links render full RSC trees (auth + membership
 * + domain queries). Prefetching them in parallel contends for Supabase RTTs
 * and is the dominant cause of 1–8s "duplicate" Network-tab rows.
 */
export const PRODUCT_LINK_PREFETCH = false;

export const NAVIGATION_ANIMATION_ID = {
  ACTIVE_PRODUCT_TAB: "active-product-tab",
} as const;
