# Current Product Gap

This document compares the discovered real-world Together domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- Product Definition v2 lists "Partnership & policies" as `F-Together` and Core/MVP.
- Domain philosophy defines Together as the surface that answers "who is we?"
- The bounded context is `tenancy`.
- Current product IA includes Together as a bottom navigation group.
- Current Together screens include members, invitations, invite accept, policies, and preferences.
- Current tenancy constants define roles: `admin` and `partner`.
- Current tenancy constants define invitation statuses: pending, accepted, revoked, expired, and declined.
- Current tenancy constants define a household member limit of 2.
- Current tenancy constants define invitation TTL as 7 days.
- Current household creation checks for existing active membership before creating a household.
- Household creation seeds household essentials and stores base currency, locale, and timezone.
- Current invitation flow supports create, accept, decline, revoke, expiry, email mismatch, already-member, already-pending, and household-full outcomes.
- Current policy loading exposes overspend policy, month close mode, income allocation mode, caller role, and edit capability.
- Current policy update is admin-only and records partner-visible policy events through `household_policy_events`.
- Current member listing exposes household summary and active member rows with role, email, display name, and self marker.
- RLS and membership checks appear as a cross-domain access foundation in architecture and business cohesion artifacts.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
|--------------------|--------------------------|-------------|
| Households may include more than two financially relevant people. | `HOUSEHOLD_MEMBER_LIMIT` is 2. | Current product is factually limited to two members. |
| Extended family can affect household money without being members. | Together models household members and invitations. | No observed representation of non-member family influence or obligations in Together. |
| Legal account holder and household member can differ. | Accounts are household-scoped elsewhere; Together owns membership. | No observed consent or account-holder relationship model in Together. |
| A member may leave or become inactive while history remains sensitive. | Member queries filter `is_active`; invitation states exist. | No observed user-facing lifecycle artifact for member exit, separation, or historical access interpretation. |
| Different partners may consent to different external data sharing. | Together currently handles household membership and policies. | No observed per-provider or per-account consent record in Together. |
| Trust events include more than policy changes. | `household_policy_events` supports policy events. | No observed general household audit scope beyond policy events. |
| Household roles may need careful interpretation in sensitive relationships. | Roles are `partner` and `admin`. | No observed safety or coercive-control treatment in Together artifacts. |
| Real households may have asymmetric engagement. | Screen blueprints identify Partner/Admin/Steward personas generally. | No observed current Together artifact that records engagement preference or responsibility split. |
| Household identity may change over time. | Household name is stored and displayed. | No observed lifecycle around rename history, household inactive state in UI, or household archival semantics. |
| Informal agreements may differ from product policies. | Policies cover overspend, month close, and income allocation. | No observed way to record non-product household agreements as discovery facts. |
| Vietnamese household finance often relies on individual accounts and wallets. | Together models membership, not external account ownership. | No observed bridge between member identity and externally held individual financial sources. |

## Product-Definition Alignment Observations

- The strongest alignment is the recognition that household membership must exist before money actions.
- The current product correctly treats Together as a supporting collaboration domain rather than a ledger.
- Current scope is intentionally minimal: two roles, two members, invitation flow, and a small policy set.
- The current observed product has clear MVP constraints; many real-world household complexities are absent from the observed Together surface.

No implementation changes are proposed in this discovery phase.
