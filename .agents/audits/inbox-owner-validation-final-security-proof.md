# Inbox Owner Validation Final Security Proof

## 1. Executive Summary

**Status: BLOCKED. Final workstream verdict: NOT READY TO CLOSE.** Candidate A is not accepted and was not integrated. Its existing direct benchmark and six-item equivalence results are promising, but the required current-owner, former-owner, and foreign-household source cases remain unproven.

The configured Supabase project is not a safe fixture target. The 8 Sep 2026 production-data isolation audit identifies `family-finances-2` (`bbzffxvgocjwsdbujvgn`) as the only active hosted database and the de facto live financial store, with non-fixture household data. The older “development” guard permits this same project and is not an isolation boundary. No local Supabase stack is available: `supabase/config.toml` is absent and `docker ps` showed no running containers. Creating authenticated fixtures in the linked project would violate the requirement to avoid production mutations, so no fixture or live write was attempted.

The Inbox route, database, policies, and infrastructure remain unchanged. No service-role credential was used; no database or production data was mutated.

## 2. Fixture Strategy

Phase 1 inspection found normal product paths for household creation, invitations, invitation acceptance, and member removal. Membership removal calls the authenticated `remove_household_member` RPC and retains former-member history. These paths are implemented in `modules/tenancy/application/create-household.ts`, `create-invitation.ts`, `accept-invitation.ts`, and `membership-lifecycle.ts`.

The existing ownership and Together E2E harnesses are not safe fixture creators for this task: `scripts/ownership-test-harness.mjs` explicitly uses a service-role client to provision disposable identities and rows, and the lifecycle E2E spec invokes that harness during setup and seeding. The Inbox populated-fixture script also uses service-role writes. Those paths were not run. The linked hosted project cannot be treated as development-only based on its guard name, and the repository has no configured local Supabase stack. Thus there is no safe environment in which to complete the normal-authenticated fixture flow during this proof.

**Fixture mutations: none. Service role used: no.**

## 3. Current Owner Case

**BLOCKED / unavailable.** The prior closeout found no personal source in the signed-in E2E household’s Inbox queue or visible source inventory owned by the current member. The expected contract remains: active owner, `isOwnedByMe=true`, `canMutate=true`, capability `actionable`. Candidate A was not live-compared for this owner case.

## 4. Former Owner Case

**BLOCKED / unavailable.** The prior closeout found no inactive membership or source owned by a former member. The application supports normal member removal, and `tests/e2e/together-lifecycle.authenticated.spec.ts` exercises a former-owner display after removal, but its setup/seeding helper uses the service-role harness. It was not run against the linked live database.

Expected current behavior is `ownerStatus=former`, `canMutate=false`, capability `read_only_former_owner`; Candidate A must match exactly. No source ownership was changed and no member was deactivated for this proof.

## 5. Foreign Household Case

**BLOCKED / unavailable.** The prior closeout found no source row in the second authenticated household. No foreign source ID was available from a fixture harness, and no source was created. Candidate A therefore has no live foreign-parent/RLS probe for this case.

The expected result remains: the source query returns no parent row, no embedded owner information, and no foreign details; the Inbox mapper reports `source_unavailable` where applicable.

## 6. Anonymous / Non-Member

**Existing read-only current-path evidence: PASS; Candidate A recheck not completed.** The prior closeout records that anonymous source reads were denied with SQLSTATE `42501` and returned no row. An authenticated identity without household membership could not read an existing target-household transaction. Those baseline results do not complete the requested Candidate A recheck. No anonymous or non-member write was attempted.

## 7. Full Security Matrix

The first six rows below reflect the prior closeout’s live evidence on the available fixture. Anonymous and non-member evidence is also from that read-only closeout. The three unavailable required ownership/privacy cases remain acceptance blockers.

| Case                     | Current                                         | Candidate A                                                                             | Match                           |
| ------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| Current active owner     | Not available; no current-owned personal source | Not probed                                                                              | BLOCKED                         |
| Other active owner       | Active owner; read-only non-owner               | Embedded active state matched the current active-membership lookup; read-only non-owner | PASS on available fixture       |
| Former owner             | Not available; no inactive membership/source    | Not probed                                                                              | BLOCKED                         |
| Household-owned          | Actionable; no personal owner ID                | Actionable; unchanged                                                                   | PASS on available fixture       |
| Foreign source           | Not available; no foreign source row            | Not probed                                                                              | BLOCKED                         |
| Missing source           | `source_unavailable` / unavailable              | `source_unavailable` / unavailable                                                      | PASS on available probe         |
| Anonymous                | Denied; no source row in prior probe            | Not specifically rerun/attributed to Candidate A                                        | BLOCKED for Candidate A recheck |
| Authenticated non-member | Hidden; no source row in prior probe            | Not specifically rerun/attributed to Candidate A                                        | BLOCKED for Candidate A recheck |

All rows do **not** pass. Candidate A fails the acceptance gate by missing evidence, not by an observed authorization mismatch.

## 8. Raw Equivalence

**PARTIAL: 20/20 paired comparisons passed on the prior six-item fixture.** The available rows covered four transactions and two savings: three household-owned and three personal sources owned by another active member. Compared fields included source visibility, source ID/type, scope, owner ID and active state, availability/error status, note, category, and account name.

The required current-owner, former-owner, and real foreign-household cases were not included, so the required 20 comparisons including those cases were not run. Full raw equivalence is therefore **not proven**.

## 9. Capability Equivalence

**PARTIAL: 20/20 paired comparisons passed on the prior six-item fixture.** The existing resolver, source-capability resolver, and Inbox mapper produced matching results for the three household-owned actionable rows and three active-other-owner read-only rows. The comparison covered capability, actionability, owner/former/unavailable state, enrichment, labels, display fields, lifecycle data, and assignment fields.

No live former-owner or current-owner comparison was included, and the foreign source case was unavailable. Full capability equivalence is therefore **not proven**.

## 10. Candidate Decision

**Candidate A: BLOCKED, not accepted.** Current-owner, former-owner, and foreign-source gates are unmet. The task requires every security/equivalence row to pass before integration; existing partial evidence and latency improvement do not waive that requirement.

Keep the current route shape, including `listActiveMembershipIds()`. Candidate B remains rejected and no new read model or Inbox RPC is justified by this incomplete proof.

## 11. Implementation

No production implementation was made. Source enrichment selections, `listActiveMembershipIds()`, capability resolution, mapping, status, assignment, unread count, detail prefetch, and Plan behavior remain unchanged. No schema, RLS policy, Auth, or infrastructure changes were made.

## 12. Direct Benchmark

These are the prior closeout’s 20 interleaved direct samples, not a new benchmark from this turn. They compare the current dependent source/owner path with Candidate A’s experimental embedded relation shape on the available fixture.

| Path                                    | Samples | Calls | Stages after queue |   Median |      P75 |      P95 |        Max | Median bytes | Errors |
| --------------------------------------- | ------: | ----: | -----------------: | -------: | -------: | -------: | ---------: | -----------: | -----: |
| Current: source wave → owner validation |      20 |     3 |                  2 | 572.5 ms | 672.6 ms | 764.4 ms | 1,374.8 ms |        1,173 |      0 |
| Candidate A: embedded owner activity    |      20 |     2 |                  1 | 278.8 ms | 354.7 ms | 782.3 ms |   940.7 ms |        1,208 |      0 |

No post-integration benchmark exists because Candidate A was not accepted or integrated.

## 13. Browser Closeout

The prior closeout’s fresh current-path browser reprofile used one warmup and ten warm authenticated `/vi/inbox` navigations. It measured TTFB median **315.2 ms**, first-row median **1,444.3 ms** (p95/max **1,696.4 ms**), and full-queue median **1,444.3 ms**. The route remained at **7 initial Auth/Supabase fetches and 4 dependency stages**, including the owner-validation request. The measurement used the current path; it is not a post-integration Candidate A result.

No browser benchmark was run after this proof began because no code was integrated and no safe authenticated fixture environment was available. Candidate A’s target of 6 fetches / 3 stages and the post-integration first-useful target are unverified.

## 14. Cleanup

No temporary households, memberships, invitations, or financial source rows were created, so no cleanup was required. Existing user or household data was not altered.

## 15. Final Workstream Verdict

**NOT READY TO CLOSE.** The missing live security cases cannot be created safely on the only configured hosted database, and no isolated local stack is configured or running. Candidate A remains unaccepted; preserve the current security-required route shape until an isolated development/E2E Supabase project or local stack is available for authenticated fixture creation through normal product flows.

| Closeout field                | Result                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Status                        | BLOCKED                                                                                      |
| Fixture method                | None; safe development-only target unavailable                                               |
| Service role used             | NO                                                                                           |
| Current owner                 | BLOCKED                                                                                      |
| Other active owner            | PASS on available fixture                                                                    |
| Former owner                  | BLOCKED                                                                                      |
| Foreign source                | BLOCKED                                                                                      |
| Anonymous                     | PASS in prior read-only evidence                                                             |
| Non-member                    | PASS in prior read-only evidence                                                             |
| Raw equivalence               | PARTIAL; 20/20 available fixture only                                                        |
| Capability equivalence        | PARTIAL; 20/20 available fixture only                                                        |
| Candidate A                   | BLOCKED / not accepted                                                                       |
| Inbox fetches                 | Before 7; after 7 (unchanged)                                                                |
| Inbox stages                  | Before 4; after 4 (unchanged)                                                                |
| Dependent path median         | Before 572.5 ms; after N/A (not integrated)                                                  |
| First useful median           | Prior closeout 1,684 ms; fresh current-path reprofile 1,444.3 ms; no post-integration result |
| Database changes              | NONE                                                                                         |
| Production data mutations     | NONE                                                                                         |
| Development fixture mutations | NONE                                                                                         |
| Infrastructure changes        | NONE                                                                                         |

## 16. Raw Evidence

- Source of truth: `.agents/audits/inbox-owner-validation-closeout.md`, sections 2, 3, 4, and 7–16. It records the previous six-item fixture, candidate projection probes, available-case equivalence, direct benchmark, and fresh browser reprofile.
- Environment boundary: `.agents/audits/production-data-isolation-backup-audit.md` (dated 8 Sep 2026) records that the configured host and `supabase/.temp/project-ref` resolve to `bbzffxvgocjwsdbujvgn`, the only active hosted database, with three households and non-fixture financial data. It also records that the `development` guard permits this same project and is unused as an isolation control.
- Local stack availability: `supabase --version` returned `2.20.5`; `supabase/config.toml` is absent; `docker ps` returned no running containers.
- Fixture harness review: `scripts/ownership-test-harness.mjs` states that setup uses service role to provision fixtures. `scripts/inbox-populated-fixture.mjs` also constructs an admin client and writes directly. Neither was executed.
- Product path review: household/invitation/member lifecycle application modules support normal authenticated RPC paths, but no such mutation was run against the linked hosted database.
- Verification: `npm run typecheck` passed. `npm run test` completed with 227 files passing and 4 failing (1,447/1,451 tests); the four failing files match the unrelated failures already listed in `.agents/audits/final-authenticated-performance-closeout.md`. `npm run lint` failed on 14 errors in existing `output/` scripts, with 6 warnings. Repository-wide `npm run format:check` reports 197 files with existing formatting issues; the new report passes `npx prettier --check .agents/audits/inbox-owner-validation-final-security-proof.md`.
- This proof turn performed no remote write, no authenticated fixture mutation, no policy change, no migration, no production route change, and no service-role operation.
