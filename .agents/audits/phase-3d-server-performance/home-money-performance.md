# Phase 3D — Home and Money performance

## Read paths

Money already loads its position, cards, savings, debts, loans, and investment summaries through parallel application reads. Home also composes its ledger, investment, savings, debt, loan, transaction, jar, and Inbox sections from their owning modules. These screens preserve their module-specific financial calculations and do not share a stale aggregate snapshot.

## Measurements

| Destination | Supabase calls per sample (median) | Longest Supabase request (median / p95) | Data content, cold med / p95 | Data content, warm med / p95 |
| ----------- | ---------------------------------: | --------------------------------------: | ---------------------------: | ---------------------------: |
| Money       |                                  8 |                            319 / 838 ms |             1,058 / 1,624 ms |               962 / 1,059 ms |
| Home        |                   13 cold; 11 warm |    511 / 747 ms cold; 349 / 672 ms warm |             1,041 / 1,092 ms |               963 / 1,337 ms |

Money's parallel reads generally returned in about 250–350 ms each; auth and membership resolution added separate request work before or alongside the page data. Home → Money's seven domain reads remained parallel. No single SQL query dominates the roughly 0.9–1.1 second warm content time.

## Decision

Keep the existing domain-owned summaries and parallel loading. Combining them into a new RPC would add a database API and financial integration surface without evidence that SQL execution is the bottleneck. The remaining delay is mostly request/network and route composition; avoid stale balance snapshots or changes to accounting boundaries.

## Source files

- [Money route](<../../../app/[locale]/(product)/money/page.tsx>)
- [Home route](<../../../app/[locale]/(product)/home/page.tsx>)
- [Home streaming sections](<../../../app/[locale]/(product)/home/home-streaming-sections.tsx>)
