# Risk Analysis

| Risk | Category | Impact | Likelihood | Mitigation |
|---|---|---:|---:|---|
| Estimated interest treated as posted income | Accounting | High | Medium | Keep accrued estimate separate from provider-confirmed posted interest. |
| Early withdrawal preview differs from provider payout | Accounting | High | Medium | Require confirmation and reconciliation against provider result. |
| Savings confused with jars | Financial behavior | High | High | Enforce BR-01 language and ownership boundaries. |
| Auto-renewal without household awareness | Financial behavior | Medium | Medium | Route maturity decisions through Inbox; saved preference remains advisory unless SoT evolves. |
| Deposit insurance overexposure | Financial | High | Medium | Track exposure by legal owner and institution. |
| Provider bankruptcy or resolution | Financial | High | Low | Model exceptional state and insured/uninsured amount. |
| Foreign/residency eligibility mismatch | Legal | Medium | Medium | Capture product type and legal depositor eligibility where relevant. |
| Tax treatment changes | Legal | Medium | Medium | Keep tax rules configurable by jurisdiction and effective date. |
| Joint ownership ignored | Legal | High | Medium | Track legal owners separately from household visibility. |
| Provider terms overwritten on renewal | Accounting | Medium | Medium | Immutable cycle snapshots. |
| Duplicate settlement | Accounting | High | Low | Idempotent settlement and reconciliation workflow. |
| Failed funding creates phantom savings | Accounting | High | Medium | FundingPending and Failed states must be explicit. |
| Manual provider catalog stale | Business | Medium | High | Mark provider data as manually maintained unless live feed exists. |
| Recommendation becomes financial advice | Legal/UX | Medium | Medium | Frame as informational decision support, not regulated advice. |
| Health mutates savings decisions | Architecture | High | Low | Enforce BR-24 read-only boundary. |
| Savings module imports Plan/Inbox/Health directly | Architecture | Medium | Medium | Preserve anti-edges and app-level orchestration. |
| One provider/account holds too many purposes | UX | Medium | High | Keep purpose mapping in Plan/Goals, not product identity. |
| Currency conversion distorts real position | Accounting | High | Medium | Store product currency and base-currency valuation separately if multi-currency evolves. |
| Provider payout delays | UX/Accounting | Medium | Medium | Add pending settlement and exception states. |
| Legal dispute over household-owned but individually titled savings | Legal/UX | High | Medium | Separate legal title from household relevance and visibility policy. |

