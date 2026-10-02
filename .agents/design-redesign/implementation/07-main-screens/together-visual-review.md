# Together Overview — Stitch Visual Review

## Status

**BLOCKED.** The implementation and automated checks are complete, but the required post-change browser comparison cannot proceed: the existing Brave tab now renders the app error boundary, and the Mac reports locked. Do not treat this as visual approval until the authenticated route is visible again and the evidence below is captured.

## Source and scope

- Stitch project: `16826760243481546078` — ViNha Mobile Finance Icon System
- Canonical dark screen: `d0e81a7d33c047aaa1d163ba6caf18d8`
- Light screen: N/A
- Route: `/vi/together` (English counterpart: `/en/together`)
- Scope: Together Overview presentation, its shared member row, shared CTA styling, loading geometry, and focused contract tests. Member, invitation, role-management, leave/remove, and settings-detail flows were not redesigned.
- Canonical Stitch export: [screen image](evidence/together-overview/stitch-d0e81a7d33c047aaa1d163ba6caf18d8.png) · [source HTML](evidence/together-overview/stitch-source.html)

## Differences found and changes

Ten visual/composition differences were identified:

1. The page header used the generic Together title and household name metadata instead of Stitch’s icon, “Hộ của chúng ta” headline, and current-role pill. The header now follows that hierarchy and keeps the household name in the identity card.
2. The household summary used a hero treatment and square initials. It now uses the shared elevated card, circular shared avatars, household name, real member count, and role context.
3. The overview reused the denser management-row presentation. Its compact variant now uses tokenized padding and wrapping content, and omits the role-explanation box from the overview only.
4. Overview avatars were square, custom initials containers. They now use shared `Avatar` fallbacks and semantic role tones.
5. The active-member state was not visibly labeled. The overview now shows translated “Đang hoạt động” / “Active” text with the state dot and includes it in the accessible row name.
6. The invitation CTA used the stronger default treatment. It now uses the softer shared link variant while retaining the existing invite route and permission gate.
7. Pending-invitation navigation did not surface the count at the conditional invitation section. That link now includes the real pending count; no invitation preview is rendered when there are none.
8. The collaboration group did not include household preferences. Shared rules and household preferences now sit in the same grouped section.
9. A generic app/account settings entry was placed inside Together. It was removed from this overview; personal settings remain outside this screen.
10. The loading skeleton used the former hero/header geometry. Its header, household card, member rows, and grouped destinations now follow the updated screen structure.

The Stitch “Đang chạy” household status is not shown: the current household summary only supplies an ID and name, with no household running-state field. No mock value or permission was invented. This is **MOCK / LOGIC PENDING** (zero mock data rendered), and needs a product data contract before it can appear.

## Data mapping and semantics

| Stitch element                                                  | Current source                                                | Classification                       |
| --------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| Household name                                                  | `result.household?.name`                                      | DIRECT DATA                          |
| Member count                                                    | `result.members.length`                                       | DERIVED FROM VERIFIED EXISTING DATA  |
| Current role                                                    | `membership.role`                                             | DIRECT DATA                          |
| Current-user marker                                             | `member.isSelf`                                               | DIRECT DATA                          |
| Member initials                                                 | Existing `memberInitials(email, displayName)` helper          | DERIVED FROM VERIFIED EXISTING DATA  |
| Active state                                                    | `listHouseholdMembers()` returns active memberships only      | DERIVED FROM VERIFIED EXISTING DATA  |
| Pending invitation count/preview                                | `listPendingInvitations()`                                    | DIRECT DATA                          |
| Invite action                                                   | Existing `canInvite` gate and `TOGETHER_PATH.INVITATIONS_NEW` | EXISTING LOGIC PRESERVED             |
| Shared rules / household preferences                            | Existing policies and preferences routes                      | EXISTING DATA AND ROUTES             |
| Household “running” state                                       | No corresponding field in the current summary query           | NOT APPLICABLE; MOCK / LOGIC PENDING |
| Stitch sample names, emails, admin role, and one pending invite | Not copied into the application                               | No mock data                         |

The authenticated household observed before the change was named “Chúm ta,” with three active members; the signed-in membership role was Partner and the real pending invitation count was zero. Stitch’s sample shows a different household, an Admin role, and one pending invitation. The live household, role, and invitation state remain authoritative (**REAL DATA DIFFERENCE**). Invite visibility continues to follow the existing permission gate; role presentation does not add capabilities.

## Shared components changed or reused

- Changed: `TogetherMemberRow` (compact overview presentation; management presentation remains separate), `TogetherPrimaryLink` (optional tonal treatment), and the Together loading skeleton.
- Reused: shared `Avatar`, `StatusBadge`, `IconContainer`, `AppIcon`, `SectionHeader`, `TogetherNavRow`, and `TogetherNavGroup`.
- Existing user identity, membership checks, invitation queries, routes, and mutation flows remain in place.

## Browser evidence and remaining work

The canonical Stitch screen was exported and saved above. The authenticated `/vi/together` route was opened and inspected before the change. The current browser session no longer presents the route: it shows the app error boundary, and computer-use reports that the Mac is locked. The before screenshot was not persisted, and no after screenshot can be verified or saved yet.

Required browser evidence still outstanding:

- Save `current-before` and `current-after` screenshots alongside the Stitch export.
- Reopen the authenticated route and compare it against the saved Stitch image.
- Check 360×800, 390×844, 430×932, plus the project UI breakpoints 440, 768, and 1280 CSS pixels; inspect bottom navigation and overflow.
- Verify Vietnamese and English, light and dark themes, keyboard focus, reduced motion, and long names/copy.
- Confirm no current implementation defects remain and update this report’s verdict.

No other screen was modified for this review.

## Validation

| Check                                         | Result                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Together unit/contract tests                  | PASS — 16 tests                                                     |
| Full unit suite                               | PASS — 240 files, 1,575 tests                                       |
| `npm run lint`                                | PASS                                                                |
| `npm run typecheck`                           | PASS                                                                |
| `npm run build`                               | PASS                                                                |
| Authenticated browser comparison after change | BLOCKED — current tab shows app error boundary; Mac reported locked |

## Verdict

**TOGETHER VISUAL PARITY NEEDS MORE WORK**
