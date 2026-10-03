# Money → Savings navigation — Phase 2

## Implementation

Changed only the Create return behavior. Production files:

- `app/[locale]/(product)/money/savings/new/create-saving-navigation.tsx` — one local return hook shared by the header and Cancel, plus a small client header wrapper.
- `app/[locale]/(product)/money/savings/new/page.tsx` — uses that header wrapper; session gate and data loading remain unchanged.
- `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx` — first-step Cancel uses the same return hook. Step Back still changes wizard steps. Successful creation still calls `router.replace(moneySavingsPath(result.id))`.

Focused tests added in `tests/unit/savings-create-navigation.test.tsx`. Shared TopAppBar and other Back controls are unchanged; its existing `onBack` button primitive is reused.

Previously, header Back linked forward to Savings and Cancel used `router.push(Savings)`. Both added a new Savings entry and reloaded session/domain data. Both now restore history only when browser-native state proves the immediately previous entry is the current-locale Savings route in the same document and origin, and Create is a later in-document entry rather than the document’s activation entry. Otherwise they use the localized router’s `replace(APP_PATH.MONEY_SAVINGS)` fallback.

The activation check matters: real Chromium verification showed that `sameDocument` can remain true after refresh. `navigation.activation.entry.key` identifies the entry that activated the document; comparing it with `navigation.currentEntry.key` rejects a directly loaded or refreshed Create while allowing later SPA entries. The activation stays constant during same-document navigation according to the [HTML Standard](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-navigationactivation-interface). The existing-entry API and browser support are described in [Chrome’s Navigation API documentation](https://developer.chrome.com/docs/web-platform/navigation-api/).

No source-link marker, URL flag, local/session storage, global listener/store, `document.referrer` heuristic, or private Next history field is introduced. The installed TypeScript DOM library lacks `Window.navigation`, so the local file describes only the native fields it reads. Browsers lacking Navigation/activation evidence conservatively use the fallback; the cache-restoration performance result applies when that native proof and the router cache are available.

## History behavior

```text
Before:       Savings A → Create B → forward Back/Cancel → Savings C
After:        Savings A → Create B → Back/Cancel → restore A
Direct:       new-document Create B → replace B with localized Savings B′
External:     external document → Create B → replace B with localized Savings B′
Refresh:      refreshed Create B → replace B with localized Savings B′
Forward:      restored A → browser Forward → existing Create B → Back → A
```

All four measured Back operations restored the exact same Savings entry key, `d4fe20f0-a8ad-41e5-b816-1c6c5bb9c02d`. Current index moved 3 → 2; total history length remained 4. Re-entering Create truncated the previous forward Create slot and added its replacement, rather than accumulating Savings entries. All warm repetitions retained the same Savings A key. Native entry keys/indices were read directly, rather than inferred from equal URLs.

Browser Forward restored the existing Create B key (2 → 3), with no new entry or RSC request. Header Back via Enter and wizard Cancel via Space each returned to the original A key (3 → 2), also without new requests. Fallback cases kept their current index and history length and removed Create from that slot. The application does not intercept or trap ordinary browser Back/Forward.

## Network behavior

Counts below apply to history-restoration Back, in all four measured passes. Browser CDP captures RSC requests; server HTTP/perf spans independently capture remote auth, membership, loader execution, and actual Supabase HTTP calls. Counts include a 1.2-second observation period after loaded-screen visibility. Favicon traffic is outside these metrics.

| Metric                               |    Phase 1 | Phase 2 |
| ------------------------------------ | ---------: | ------: |
| Demand RSC requests                  |          1 |       0 |
| All RSC requests, including prefetch | At least 1 |       0 |
| Remote `getUser`                     |          1 |       0 |
| Active membership resolution         |          1 |       0 |
| Primary Savings REST read            |          1 |       0 |
| Owner-membership validation read     |          1 |       0 |
| Total remote Auth/REST HTTP          |          4 |       0 |
| Savings domain reload                |        Yes |      No |

Header Back and Cancel history-restoration correctness controls, including the Vietnamese header, also generated zero demand RSC and zero remote Auth/REST calls. Direct-entry, external-entry, and refresh fallbacks correctly use ordinary authenticated forward replacement: each had one demand RSC, one remote user verification, one active membership resolution, one Savings reload, and four Auth/REST HTTP calls. Small prefetch shell requests after fallback are distinguished from its single demand request; prefetch strategy is unchanged.

## Performance

Used the same general environment and loaded-screen measurement as Phase 1: production-mode isolated copy on port 3102, same installed dependencies and hosted Supabase project (`bbzffxvgocjwsdbujvgn`, ap-southeast-2), same E2E user and existing household data, headed Chromium at 440 × 900, normal motion and no throttling. After the final code change and all repository checks completed, restarted the profiling server/browser and collected one first/cold-ish flow and three warm repetitions. Login happened before measurement; no fixture or financial data was written.

Cold-ish control follows Money → Savings → Create → header Back. Warm repetitions start from the restored Savings A, enter Create through its existing link, and activate the actual header Back button. This isolates the requested transition; Money and Detail receive lightweight forward smoke checks rather than another broad audit. Each measured transition retains the 1.2-second idle before activation; click capture, loaded destination marker, and two animation frames match Phase 1. Changing the locator from the old link to the new button reflects the implemented control, not a different timing criterion.

| Transition       |  Phase 1 | Phase 2 warm median |      Saved | Improvement |
| ---------------- | -------: | ------------------: | ---------: | ----------: |
| Create → Savings | 1,195 ms |             40.3 ms | 1,154.7 ms |       96.6% |

| Pass             | Loaded Savings visible | Demand RSC | Auth/REST HTTP |
| ---------------- | ---------------------: | ---------: | -------------: |
| Cold-ish/control |                40.7 ms |          0 |              0 |
| Warm 1           |                39.7 ms |          0 |              0 |
| Warm 2           |                40.3 ms |          0 |              0 |
| Warm 3           |                44.6 ms |          0 |              0 |

“Visible” means loaded destination DOM plus its next paint opportunity, not exact compositor presentation or completion of all animations. The three warm samples support a measured improvement, not a universal latency guarantee. The reduction is supported by the actual restored entry and removal of the demand/data requests; forward domain reads still vary with hosted-service/network latency. Older browsers or unavailable router cache may require normal loading.

## Correctness

- **Entered from Savings:** exact prior history key restored in all four measured passes; no push/replace for this return branch. Queries/filters on the prior Savings URL can be retained because matching uses its localized pathname, then restores the whole entry.
- **Direct entry:** new-tab `/en/money/savings/new` falls back to `/en/money/savings`, using replacement at index 0. No Create entry remains to form a Back loop.
- **External entry:** clicked an actual link from `http://127.0.0.1:3103` to `/vi/money/savings/new` on the app’s different origin. Header Back falls back to `/vi/money/savings`, retaining index 0; it does not return to the external page.
- **Refresh:** Savings → Create → browser reload uses fallback replacement at index 1, even though the prior Savings entry still reports `sameDocument = true`. Current-entry/activation equality supplies the reliable rejection. The unit suite also covers absent activation evidence and absent Navigation API.
- **Locale:** real EN and VI routes passed. The Vietnamese in-app header returned 1 → 0 to its Savings entry using Space, without RSC/data requests. Cross-locale previous entries are rejected in the unit suite.
- **Keyboard and focus:** header Back is the existing labeled native button (`type=button`), supports Enter and Space; wizard Cancel supports Space. After restored Back, Tab reached the Savings header Back link (`/en/money`) with no keyboard trap. No custom focus manipulation was introduced.
- **Touch/layout:** browser checks at 390 / 440 / 768 / 1280 px found no horizontal overflow. The shared small IconButton is 36 × 36 visually, with its existing `::after` target expansion measuring 44 × 44; hit-testing outside the visible button still resolves to that button. EN/light and VI/dark screenshots were visually inspected; VI also used reduced-motion emulation.
- **Forward/no loop:** browser Forward preserves B’s key, then Back and Cancel both restore A. Repeated returns do not grow history. Fallbacks replace rather than push.
- **Financial/security behavior:** no create action was submitted; successful-create navigation and mutation code are unchanged. No session helper, auth/membership gate, domain query, permission check, RLS policy, prefetch setting, provider, loading state, or animation was changed. History return uses the existing router cache; fallback still passes through Phase 1’s normal authenticated page gate.

### Forward navigation smoke

| Route            | Loaded destination            | Demand RSC | Auth/REST HTTP | Before counts retained |
| ---------------- | ----------------------------- | ---------: | -------------: | ---------------------- |
| Money → Savings  | Passed                        |          1 |              4 | Yes                    |
| Savings → Create | Passed, all four entries      |     1 each |         7 each | Yes                    |
| Savings → Detail | Passed, existing first Saving |          1 |             10 | Yes                    |

No forward-navigation optimization is claimed; these remain normal authenticated data-loading paths.

### Validation

- Focused navigation + Savings render purity: **2 files / 16 tests passed**, including **12 new navigation cases**.
- Full repository lint passed.
- Full unit suite: **242 files passed / 4 failed; 1,614 tests passed / 6 failed**. The same baseline failures remain: i18n key parity (1), Money wrapping (1), accounts presentation missing NextIntl context (3), and the date-sensitive Savings-domain test (1) reproduced before Phase 2. No new failure appeared.
- Typecheck still reports only the two existing Home translator TS2322 errors at `home-streaming-sections.tsx:99,340`; no Phase 2 source/test errors.
- Final disposable profiling production build succeeded with the same scratch-only ignored type errors and Turbopack root workaround as Phase 1. Repository Next configuration was not changed; this does not claim a clean strict production build.
- Repository format check reports 194 existing/style issues across the working tree. New Phase 2 source/test files and deliverables pass focused formatting; unrelated formatting was left alone.
- Real authenticated browser verification is the scoped E2E evidence. Broad E2E suites that mutate fixtures were not run. Existing unrelated working-tree edits remain; no unrelated changes were committed.

## Remaining bottleneck

Phase 3 should target Create’s unchanged account-loading critical path, using the existing evidence. History Back is now a cached restoration, but entering Create still waits for session resolution followed by the account pipeline (currency/accounts, owner validation, balance RPC), alongside provider loading. Detail’s core-load → secondary account/activity/package stage remains another later target. This phase made no loader, data-requirement, Suspense, streaming, CSR, GraphQL, or RPC change.

## Decision

All eight Phase 2 criteria are met by the final implementation and browser measurements: known in-app entry restores Savings; direct entry uses safe fallback; locales work; financial/auth behavior is untouched; warm Back latency improves; cached history return avoids RSC/data loading; and Forward/fallback history remains coherent. Phase 3 has not been started.

**PHASE 2 SUCCESS — PROCEED TO PHASE 3**
