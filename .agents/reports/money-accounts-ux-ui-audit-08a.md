# ViNha Money Track — 08A: Money Hub + Accounts UX/UI Audit

Audit date: 2026-08-19

Scope: Money Hub, account collection, account create/edit/detail flows, account balances/types/actions, shared Money navigation, states, privacy, content, visual hierarchy, motion, accessibility, responsive behavior, dark mode, and concrete performance concerns. Transactions are inspected only where they affect Money or Account UX.

Evidence: source inspection, canonical IA/UX/design-system documents, existing E2E coverage, and authenticated in-app browser inspection at the available fixture state. No production code was changed.

The requested `home-final-quality-07e.md` report is not present in this checkout. The related Home reports explicitly record that absence; this audit uses the available 07B, 07C1, 07D, and 07E1 evidence and the canonical artifacts.

## A. Executive summary

The Money implementation has a sound domain foundation: Money owns the real-position query, account type registry, credit-card distinction, archive command, shared AppIcon system, constrained 440px shell, semantic design tokens, and global financial privacy provider. The current authenticated screen is also usable at the tested widths and does not introduce a desktop-only layout.

The main problem is semantic and hierarchical, not a need for a new visual system. Money currently combines a dashboard-like aggregate hero, composition analytics, account objects, card liabilities, and product navigation into one long landing surface. That makes it partially duplicate Home while rendering ordinary accounts as flat transaction-like rows. The next implementation should apply the Home foundation while changing the archetype: Money should be an inventory and destination surface; an Account should be a soft/bounded financial object.

Highest-priority findings:

1. **P0 — privacy is incomplete.** The shared `FinancialPrivacyProvider` masks the Money hero, but account rows, composition values, credit-card values, and account-detail values remain visible. Some raw values also enter accessible labels. Accounts must consume the existing `FinancialValue` abstraction at every monetary-value leaf.
2. **P1 — canonical IA and runtime routing disagree.** The canonical IA names Accounts as `/money/accounts`, but the actual route redirects to `/money` because the hub owns the scan list. This is a product-architecture decision, not a styling detail.
3. **P1 — account surfaces contradict their domain semantics.** `AccountCard variant="row"` is essentially a flat divided list. Accounts are financial objects and need soft/bounded treatment, without becoming heavily elevated dashboard cards. Credit-card objects already point in the right direction but use a stronger shadow and do not mask values.
4. **P1 — Money’s hero mixes overview truth and analytics.** The aggregate real position is a legitimate Money summary, but composition inside the same emphasized surface makes Money look like a second Home dashboard. Keep one concise authoritative summary; demote or separate composition.
5. **P1 — state and form semantics need tightening.** Account-detail activity failure becomes “No activity”; account editing uses local state and a native-select wrapper instead of the shared RHF/select pattern; closing the management sheet can preserve abandoned edit state; and the add-account receipt formats with `DEFAULT_CURRENCY` rather than the household currency.
6. **P1 — accessibility target and long-value risks exist.** The Money account-create action overrides the shared 44px target with `min-h-9`; retry is a text link; raw monetary spans do not consistently use the financial-value primitive; and long names/amounts need explicit browser regression coverage.

Recommended posture: make the smallest coherent next batch. Reuse the existing provider, `FinancialValue`, `Balance`, `Amount`, `SectionHeader`, `FinancialProductCard`/bounded object pattern, AppIcon, token system, HeroUI transitions, and existing state components. Do not add a Money-specific privacy store, new icon library, new tokens, new product metrics, new layout system, or a new account schema.

## B. Route/component map

### Routes and shells

| Responsibility         | Actual source                                         | Finding                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money Hub              | `app/[locale]/(product)/money/page.tsx`               | Auth/membership gate; loads real position, credit cards, translations; builds the Money view model; renders hero, account scan, related destinations, offline banner, and failure state. |
| Accounts index         | `app/[locale]/(product)/money/accounts/page.tsx`      | Retired route; redirects to `APP_PATH.MONEY`. The comment says the Money hub owns scan + create.                                                                                         |
| Account detail         | `app/[locale]/(product)/money/accounts/[id]/page.tsx` | Loads account, recent transactions, and account list; branches between normal account and credit card detail.                                                                            |
| Product route loading  | `app/[locale]/(product)/money/loading.tsx`            | Hero and account-list skeleton; no independent Accounts loading route because the index redirects.                                                                                       |
| Product error boundary | `app/[locale]/(product)/error.tsx`                    | Generic `SystemErrorScreen` retry boundary for the product route.                                                                                                                        |
| Product navigation     | `app/[locale]/(product)/layout.tsx`                   | Shared `ChromeShell` and five-tab `BottomNavigation`; no Money-specific navigation redesign required.                                                                                    |

### Hub and collection components

| Responsibility        | Actual source                                                                                       | Finding                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money overview hero   | `app/[locale]/(product)/money/money-position-hero.tsx`                                              | Emphasized surface for total owned balance, active-account count, credit outstanding, composition, and a transactions destination. Composition values are not privacy-masked. |
| Hub account section   | `app/[locale]/(product)/money/money-hub-accounts.tsx`                                               | Client wrapper; owns online status and opens the create-account sheet. The CTA uses `min-h-9`, below the 44px shared target.                                                  |
| Account scan          | `app/[locale]/(product)/money/money-accounts-scan.tsx`                                              | Groups liquid accounts, limits initial display to four, renders account links, empty state, “See all accounts”, and separate credit-card collection.                          |
| Account object        | `modules/ledger/ui/account-card.tsx`                                                                | Supports `card` and `row` variants. The Money hub uses `row`, which is transparent/divided rather than a soft bounded object. Balance is a raw label.                         |
| Credit-card object    | `modules/ledger/ui/credit-card-card.tsx`                                                            | Bounded liability object with utilization, outstanding, available, limit, due date, and attention. Monetary labels are raw.                                                   |
| Money visual registry | `app/[locale]/(product)/money/money-account-visuals.ts`                                             | Canonical account-type icon/tone mapping; no provider-brand decoration.                                                                                                       |
| Account-type registry | `modules/ledger/application/account-constants.ts` and `modules/ledger/application/account-types.ts` | Domain types: `cash`, `checking`, `savings`, `ewallet`, `brokerage`, `credit_card`, `savings_product`, `other`; liquid types exclude credit cards and savings products.       |
| View model            | `modules/ledger/application/money-hub-view-model.ts`                                                | Groups cash/bank/wallet/savings/investment/other; sorts type then balance then name; limits rows; computes composition and authoritative credit attention.                    |

### Create, edit, actions, and detail

| Responsibility          | Actual source                                                                                                                                  | Finding                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create account UI       | `app/[locale]/(product)/money/accounts/add-account-form.tsx`                                                                                   | RHF + Zod; shared `SelectField`, `TextField`, `NumberField`, `AmountField`, `FinancialScopeField`; sheet/dialog/card presentation; resets on close.    |
| Create server actions   | `app/[locale]/(product)/money/accounts/actions.ts`                                                                                             | Wraps create, update, archive, and card commands.                                                                                                      |
| Account detail hero     | `shared/patterns/financial-account-hero.tsx`                                                                                                   | Bounded object summary with border, surface, elevation-1 shadow, and large raw amount.                                                                 |
| Credit-card detail hero | `app/[locale]/(product)/money/accounts/[id]/credit-card-hero.tsx`                                                                              | Bounded debt-toned object summary; raw outstanding/available/limit/due values.                                                                         |
| Management surface      | `app/[locale]/(product)/money/accounts/[id]/account-detail-management.tsx`                                                                     | Icon-only overflow button opens management sheet. Closing only toggles sheet state; child edit state is not explicitly reset.                          |
| Edit/archive UI         | `app/[locale]/(product)/money/accounts/[id]/account-detail-actions.tsx`                                                                        | Local `useState` edit form; `TextField`; `LabeledSelect` native select; rename/type edit; archive confirmation.                                        |
| Archive command         | `modules/ledger/application/commands/archive-account.ts`                                                                                       | Soft archive: sets `is_archived=true`, removes account from active/real-position lists, preserves historical transactions. There is no delete command. |
| Update command          | `modules/ledger/application/commands/update-account.ts`                                                                                        | Updates name/type only; opening balance is create-time data.                                                                                           |
| Balance calculation     | `modules/ledger/application/queries/get-real-position.ts`, `modules/ledger/application/account-types.ts`                                       | Real position is opening balance plus/minus balance-impacting ledger transactions; credit cards are excluded from liquid real position.                |
| Account reads           | `modules/ledger/application/queries/list-accounts.ts` and related account queries                                                              | Archived accounts are excluded from active lists; detail can return null for missing/archived records.                                                 |
| Financial formatters    | `shared/i18n/formatters.ts`                                                                                                                    | Shared currency/date/number formatting exists. The display string must stay separate from financial domain values.                                     |
| Privacy                 | `providers/financial-privacy-provider.tsx`, `shared/patterns/financial-value.tsx`, `shared/patterns/balance.tsx`, `shared/patterns/amount.tsx` | One global local-storage-backed preference. `FinancialValue` masks to `••••••` and removes the raw amount from masked accessible output.               |
| Motion                  | `shared/motion/reveal.tsx` plus Money page components                                                                                          | Motion uses `motion/react`, shared variants, and in-view observers. Money currently has multiple page/section reveals.                                 |

### Existing test evidence

`tests/e2e/money-hub.smoke.spec.ts` covers unauthenticated redirects and a credential-gated authenticated create flow. `tests/e2e/account-detail-redesign.smoke.spec.ts` contains credential-gated checks intended for 390/440/768/1280 and light/dark variants. The authenticated in-app browser fixture supplied visual evidence, but the Playwright suite could not run authenticated checks because `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` were unavailable.

## C. Current Money Hub hierarchy

Top to bottom in the authenticated runtime:

1. Contextual top app bar with Money eyebrow, headline, supporting copy, and account-count metadata.
2. Always-present Money offline banner.
3. On load failure, one surface containing `StatusAlert`, error copy, and retry link.
4. Emphasized “Real position” hero containing:
   - total owned balance;
   - active account count;
   - total credit outstanding;
   - “Where your money sits” composition with percentages and balances;
   - “View transactions”.
5. “Accounts” scan section:
   - create-account action;
   - dynamic liquid-account groups such as Cash and Bank;
   - up to four initial account objects;
   - “See all accounts” when more exist;
   - separate credit-card object collection.
6. “More”/related-finance destination group:
   - Debts;
   - Savings;
   - Investments;
   - Loan / Installment.
7. Shared bottom navigation.

This answers “what money do I have?” and “where does it live?” well. It is less clear on “what should I do next?” because account creation is visible but not always the single dominant action, and the related destinations are presented after a substantial mix of summary, analytics, and objects. It answers “does anything require attention?” only for authoritative credit-card conditions, which is appropriate; generic attention should not be invented.

The principal hierarchy problem is that the emphasized hero carries both a primary financial truth and an analytics/composition block. Home already carries household orientation and period analytics. Money should retain a concise object-oriented summary, but composition should not make the landing surface feel like another Home dashboard.

## D. Recommended Money Hub IA

Recommended hierarchy, preserving current domain capabilities:

1. **Money overview**
   - one concise authoritative Real Position/owned-money summary;
   - active-account count as supporting metadata;
   - a separate, compact credit-liability signal only when authoritative;
   - no net cash flow, spending analytics, Plan, or Inbox duplication.
2. **Accounts**
   - the primary financial-object collection;
   - grouped only by domain-backed account family when grouping improves scanning;
   - soft/bounded account objects;
   - credit cards separated visually because outstanding debt and available credit are not liquid balances;
   - one clear “Add account” action.
3. **Money destinations**
   - Debts, Savings, Loans/Installments, and Investments only as existing supported destinations;
   - keep these as mostly flat navigation links, not dashboard cards;
   - do not add empty product summaries or new metrics.
4. **Useful actions**
   - primary: Add account;
   - secondary: View transactions or the existing contextual transaction entry point, without creating a competing FAB;
   - no new action family until the domain supports it.
5. **Attention**
   - compact credit-card attention only for existing authoritative states: overdue, due soon, or high utilization;
   - use semantic status treatment when action is required, plain metadata for normal states.

The implementation should not force the current exact hierarchy if route architecture is intentionally consolidated. The minimum viable direction is: make the summary less dashboard-like, promote Accounts as the main object section, and keep destinations flat and secondary.

The key route decision is whether the hub is the canonical Accounts landing surface. The current implementation chooses consolidation by redirecting `/money/accounts` to `/money`; the canonical IA still describes a distinct Accounts destination. Do not implement both patterns simultaneously without deciding which one users should understand as the destination.

## E. Home vs Money responsibility

| Home                                             | Money                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Immediate household orientation                  | Financial inventory and money-management destinations                                       |
| Total balance as one orientation signal          | Account objects and their authoritative balances                                            |
| Net cash flow and period controls                | Account composition only if it helps navigation and does not become a second analytics hero |
| Spending analytics                               | Credit-card liability/attention from authoritative card data                                |
| Inbox attention and Plan pulse                   | Accounts, product destinations, and one clear account action                                |
| Account-first empty decision for a new household | Account creation, edit, detail, archive, and object-level actions                           |

Home currently renders “Total balance across active accounts” through the shared `Balance` primitive. Money renders the same underlying real-position concept as “Real position”. This duplication is acceptable only if the roles are distinct: Home is a quick orientation and Money is the authoritative inventory entry point. The amount should not be expanded into the same supporting analytics hierarchy on both screens.

Do not copy Home’s cash-flow, spending, Inbox, or Plan blocks into Money. Do not make Money responsible for household motivation or broad financial coaching. Conversely, do not remove account objects from Money merely to avoid one shared balance concept; accounts are Money’s core content archetype.

## F. Account object model

An Account is a financial object, so the object should communicate identity, authoritative value, state, and destination at a glance:

1. Canonical account-family icon through `AppIcon` and the existing semantic visual registry.
2. Account name as the strongest identity label.
3. Account type/family as supporting metadata, using user language rather than implementation vocabulary.
4. Authoritative Real Ledger balance as the most important value inside the object, using `Balance`/`FinancialValue`, tabular numerals, and privacy masking.
5. Ownership and relevant status as quiet metadata. Keep normal active state implicit; reserve a `StatusBadge` or semantic alert for a real problem such as zero health or credit-card attention.
6. Whole-object destination affordance through the existing route/link behavior, with an accessible name that does not leak a hidden monetary value.

Recommended visual treatment: a soft bounded object surface with a subtle token border and tonal background, modest radius/elevation from the existing system, and no decorative provider branding. The object should be visibly distinct from a flat transaction row but quieter than the single emphasized Money summary. Avoid adding a separate high-elevation card treatment to every account.

Credit cards are a related but semantically different object:

- primary value: outstanding debt;
- supporting values: available credit and credit limit;
- status: due date and authoritative attention;
- never label outstanding debt as a bank/account balance;
- keep utilization percentage visible if it is not considered sensitive, consistent with the Home privacy policy for percentages/counts.

The existing domain supports cash, checking, savings, e-wallet, brokerage, credit card, savings product, and other. The create flow intentionally exposes a narrower set because savings/products have separate architecture. The audit recommends preserving that boundary rather than adding unsupported types or provider metadata.

## G. Account list

### Grouping

Keep the existing domain-backed grouping logic—cash, bank/checking, wallet, savings, investment, and other—only when multiple groups exist. Omit empty groups. A single group can scan without an extra heading. Keep credit cards separate because their values describe liability and available credit, not liquid position.

This is preferable to a single undifferentiated ranked list when the list contains multiple account families: the user can distinguish Cash, Bank, and E-wallet without relying on color. It is also preferable to a fixed taxonomy with headings that may be empty or unsupported. The current view model already supplies the necessary grouping and sorting; reuse it.

### Density and surface treatment

The current scan has an outer bounded collection plus transparent inner rows with dividers. That is efficient, but it makes each Account read like a transaction-history row. Change only the object treatment: use a compact soft/bounded object surface or a clearly separated object stack within the collection. Do not turn every row into a large elevated card, and do not add more metadata just to fill the surface.

For 390–440px, retain fast scanning:

- name and type on the leading side;
- balance aligned consistently on the trailing side;
- ownership/status below or in the quiet metadata line;
- no provider logo unless the domain later has authoritative provider identity;
- no decorative color-only encoding;
- whole row remains the destination.

The current four-row initial limit is reasonable for a hub preview. If the Accounts route remains redirected, the “See all accounts” action is ambiguous because it returns to the same hub. Either make it a real distinct list destination or remove the false expansion affordance.

### Color and icon recognition

Use existing semantic tones for account families and attention. Color should support recognition, not define it. The current icon registry is sufficient and already avoids provider-color decoration. Every family must remain distinguishable by icon, text, and type—not only by hue—and remain understandable in grayscale.

## H. Account create/edit

### Create flow findings

The create form is intentionally small and mostly aligned with the canonical form strategy:

- RHF and Zod are used;
- shared HeroUI-backed fields are used for text, select, number, amount, and financial scope;
- the form is ephemeral and resets on close;
- field order is Account name → Ownership → Type, then type-specific fields;
- the credit-card branch exposes credit limit, statement day, due day, and linked payment account;
- no provider/currency/icon/color fields are invented;
- credit-card guidance explains that cards stay out of Real Position and respect the limit.

The main UX concerns:

1. The form strategy calls for an opening-balance consequence/preview when the opening balance posts to the real ledger. The current form shows the field and hint but no clear effect preview. Confirm whether the existing command contract supports that preview before planning UI; do not change the schema in this audit.
2. Generic failure copy—“Check the account name and amounts.”—does not identify the field or explain a server/domain rejection. Map existing error codes to the shared field/status pattern rather than adding ad hoc copy.
3. The successful receipt uses `DEFAULT_CURRENCY` when formatting the created balance. This can disagree with the household currency. Reuse the canonical household-currency source when implementation begins.
4. The create CTA currently uses a `min-h-9` override in `money-hub-accounts.tsx`; restore the shared minimum 44px target. The text labels and offline disable behavior are otherwise understandable.
5. “Connect to create” implies a connection/integration flow, while the actual product is a manually managed account form. If offline, use copy that describes the blocked mutation without implying a banking connection.

### Edit flow findings

The edit command only supports name/type changes; opening balance is correctly not presented as editable. The edit UI should retain that contract. However:

- it uses local `useState`, not the established RHF/shared form architecture;
- it uses `LabeledSelect`/native select instead of the shared `SelectField` pattern;
- it lacks the create flow’s consistent field-level validation/error ownership;
- closing the management sheet does not explicitly discard child edit state, so an abandoned edit can reopen with stale local values;
- the archive mode is semantically separate and should not be mixed with ordinary edit validation.

Next implementation should use the smallest existing shared form pattern that fits the current update command, reset edit state on close/cancel, preserve persisted values as the source of truth, and keep the save action primary with cancel secondary. No form schema expansion is recommended.

### Keyboard/mobile behavior

The current single-column form is appropriate for 390–440px. Keep type-specific fields in document order, use real labels/descriptions/errors, maintain focus through sheet transitions, and ensure the submit/cancel controls remain reachable above the keyboard. Validate long labels and Vietnamese copy in the actual browser at 390px.

## I. Account detail

### Normal account

Current hierarchy:

1. Back navigation and account identity in the top app bar.
2. Ownership badge.
3. Bounded account hero with icon, name, raw balance, and “Available balance”.
4. Quick Actions with primary Add transaction.
5. Recent activity with View all activity and flat transaction rows.

The high-level order is correct. Account detail should be an object detail surface, not an analytics dashboard. The recent transaction rows correctly remain flat/event-like. The main changes are semantic labeling, privacy primitives, and surface restraint:

- call the amount “Balance” or “Ledger balance” unless a true available-bank balance exists; the query currently represents opening balance plus ledger activity, not an external bank-availability contract;
- use `Balance`/`FinancialValue` for the amount;
- soften the object hero’s `shadow(--elevation-1)` if it reads as a second hero;
- make the contextual Add transaction action primary and keep management in the overflow;
- avoid repeating every list metadata field in large type.

The page currently maps a null recent-activity result to `recent ?? []`, which can render “No activity” when the read failed. Preserve a real empty state only for a successful empty result; expose an error/retry state for a failed activity query.

### Credit-card detail

The credit-card branch has the correct semantic separation: outstanding debt, available credit, limit, due date, utilization, current-cycle due, payment action, card-origin installments, and card activity. It should not be merged into the liquid-account balance hierarchy.

The implementation still needs the shared financial-value primitive for every monetary value, a clear distinction between outstanding/current-cycle due/available credit, and the same soft-object surface restraint. “Pay card” is the right contextual primary action when the command is authoritative. Do not add transfer or generic account actions without domain support.

### Detail actions

The current overflow structure is appropriately secondary: Edit account and Archive account. The account detail does not present too many equal-weight buttons. Keep the primary action contextual to the object (Add transaction or Pay card), keep edit secondary, and keep archive destructive and separated by confirmation.

## J. Destructive behavior

The actual behavior is archive, not delete:

- `archiveAccount` sets `is_archived=true`;
- the account leaves active lists and Real Position calculations;
- historical transactions are preserved;
- there is no delete command and no transaction-dependency blocker;
- after archive, the account detail query can no longer resolve the record and the user is returned to Money.

The current confirmation copy accurately says the account leaves Real Position lists while past transactions stay in Activity. Preserve that truth and do not label the action “Delete”.

Open product concern: the current product has no visible archived-account history or restore path. Hiding archived objects may be intentional, but the consequence is material for financial history. Decide whether archived detail should remain read-only, whether restore belongs in a later track, and how archived accounts should be discovered. This is a product decision, not a reason to invent a delete blocker in 08A.

## K. Privacy integration

The correct architecture already exists:

- `FinancialPrivacyProvider` is mounted globally by `AppProvider`;
- the shared preference is `vinha.financial-values-hidden`;
- Home and Money can consume the same state;
- `FinancialValue` masks to `••••••`, removes the raw value from the masked accessible output, and leaves counts/percentages available;
- `Balance` is the correct primitive for authoritative ledger balances;
- `Amount` is the correct primitive for signed/intention/credit/debit values.

No Money-specific privacy state or toggle should be added. Home’s global toggle should remain the user’s control for Money as well.

Required Money rendering coverage:

- Money total owned balance;
- composition segment balances;
- credit outstanding summary;
- liquid account balances in `AccountCard`;
- credit-card outstanding, available credit, credit limit, and due/current-cycle monetary values;
- normal account detail balance;
- every other account-level monetary value that appears in a visible or accessible label.

Keep visible when privacy mode is enabled: account names, types, ownership, counts, percentages/utilization, dates, and non-sensitive status wording. Mask financial values by default when the global preference is enabled. Do not concatenate raw formatted strings into parent accessible names; let the value leaf own its hidden/visible accessible behavior.

Browser evidence found a concrete P0: after enabling Home privacy mode, the Money hero total became `••••••`, but account rows, composition balances, card outstanding/available/limit, and card debt summary remained raw. The preference was restored to visible before ending inspection.

## L. Content/terminology

### General findings

The copy is generally clear and short, but several strings mix product language, implementation language, and bank terminology:

- “Real position” and “Real Ledger” are implementation/domain terms. They may be correct internal concepts, but they need user-facing validation and a concise explanation if retained.
- “Available balance” is potentially misleading for a manually managed ledger balance.
- “Outstanding and available credit — not bank Balance.” has awkward capitalization and an internal comparison in the English locale.
- “Loan / Installment” and “Vay & trả góp” are inconsistent in tone and punctuation.
- `accountsPage.subtitle` (“Household wallets and bank accounts” / “Ví và tài khoản ngân hàng của hộ”) excludes cash and other supported account families when the list can contain them.
- The Vietnamese Money supporting copy “Cùng xem tiền đang ở đâu và đang chuyển động thế nào nhé.” is friendly but “đang chuyển động” is metaphorical; it should be checked against the product’s preferred financial vocabulary.
- “Connect to create” sounds like a provider-integration action even though the form creates a manually managed account.

### Key-level rewrite plan — English

Review, without changing locale files in 08A:

- `money.header.supporting`: decide whether “what is moving” belongs on Money or should be reserved for Home cash-flow context.
- `money.accountsPage.subtitle`: use a neutral object description that covers supported account families.
- `money.accountsPage.creditCardsHint`: replace “not bank Balance” with a plain distinction such as “Credit values are separate from your liquid balance.” Exact wording requires product/content approval.
- `money.accountDetail.balanceLabel`: replace “Available balance” unless the domain adds an available-balance contract; “Balance” is the safe current description.
- `money.accountDetail.archiveConfirmBody`: keep the accurate archive/history consequence; avoid “delete” language.
- `money.related.loanInstallmentTitle`: choose one stable noun pattern and punctuation.
- `money.hub.emptyTitle`/`emptyDescription`: retain the account-first intent; ensure the empty copy covers the supported first-account path without implying a provider connection.
- `money.createAccount` and offline CTA variants: use one clear create/add verb and describe offline mutation blocking separately.

### Key-level rewrite plan — Vietnamese

- `money.header.headline`/`supporting`: keep concise household language; validate “tiền đang chuyển động” against the canonical term for cash flow/activity.
- `money.accountsPage.subtitle`: avoid narrowing the list to wallets/banks when Cash, Credit card, Other, or product-backed types are present.
- `money.accountsPage.creditCardsHint`: use a consistent distinction between “dư nợ”, “hạn mức còn lại”, and “số dư tài khoản”; avoid direct English sentence structure.
- `money.accountDetail.balanceLabel`: use “Số dư” unless an authoritative “số dư khả dụng” contract exists.
- `money.types.checking`: “Thanh toán” may be a subtype label, while “Ngân hàng” is the family term. Preserve the domain distinction rather than globally replacing it.
- `money.types.credit_card`: keep “Thẻ tín dụng”; do not call its outstanding debt “số dư”.
- `money.related.loanInstallmentTitle`: choose a stable user-facing term for loans/installments.
- `money.accountsPage.openingBalanceHint`: simplify “sổ cái thật” if it is too implementation-oriented for first-run users; retain the domain meaning in a short description.

Canonical Vietnamese nouns to preserve deliberately: `Tài khoản`, `Số dư`, `Tiền mặt`, `Ngân hàng`, `Ví điện tử`, `Thẻ tín dụng`, and the chosen active/archived state terms such as `Tài khoản đang dùng` / `ngừng dùng` where the product exposes those states. Do not globally replace “checking” with “bank” or “balance” with “available balance” without checking the domain semantics.

## M. Surface Decision Model application

| Current block               | Intended semantic class                   | Current treatment                      | Verdict / plan                                                                             |
| --------------------------- | ----------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Money position total        | Primary financial truth / screen summary  | Emphasized surface                     | Keep one emphasized summary, but remove or demote composition from the same hero.          |
| Composition rows            | Analytics/open section                    | Nested inside emphasized hero          | Split into an open or quiet supporting section if retained; do not let it dominate Money.  |
| `AccountCard variant="row"` | Financial object                          | Transparent row with divider           | Too flat for the object archetype; use a soft/bounded object surface.                      |
| `CreditCardCard`            | Financial object with liability semantics | Bounded card with utilization          | Direction is correct; soften excess elevation and add privacy primitives.                  |
| `FinancialAccountHero`      | Financial object detail                   | Bounded, elevated, large value         | Correct bounded intent; reduce repeated hero weight and use shared Balance/FinancialValue. |
| `CreditCardHero`            | Financial object detail / liability       | Bounded debt-toned surface with shadow | Correct semantic split; keep debt tone semantic and non-neon, mask all amounts.            |
| Transaction rows            | Event/history                             | Flat list rows                         | Correct; do not bring account-card treatment into Transactions.                            |
| Add account action          | Task / creation action                    | SectionHeader action                   | Correct location; restore 44px target and keep one primary action.                         |
| Archive confirmation        | Destructive task/status                   | Danger alert + confirmation            | Correct; preserve archive truth and focus behavior.                                        |
| Empty account state         | Setup state                               | EmptyState plus add action             | Correct; one clear Add account action and no marketing illustration.                       |
| Offline banner              | Status                                    | Shared mutation-offline banner         | Correct; keep read-only availability explicit.                                             |
| Related finances            | Navigation/destination                    | Bounded “More” section                 | Too card-like for navigation; lighten toward mostly flat destination links.                |
| Ownership badge             | Secondary metadata                        | Badge on each object                   | Acceptable if useful, but avoid badge inflation for every normal state.                    |

This classification keeps the foundation shared while making Money’s surfaces object-oriented rather than Home-like.

## N. Visual foundation

### Typography and amounts

Use the existing Geist typography and semantic type scale. Keep tabular numerals for balances. The account balance is the strongest value inside an object, but it should not use the same page-level emphasis as the Money summary. Replace raw `span` labels with the shared `Balance`/`Amount`/`FinancialValue` primitives according to semantic meaning.

Do not invent a new money formatter. Continue using `shared/i18n/formatters.ts` for display strings, never persist formatted values, and use the actual household currency rather than `DEFAULT_CURRENCY` in the create receipt.

### Surfaces, borders, radius, elevation

Apply the existing Surface Decision Model and tokens:

- one Level 2 emphasized surface for the primary Money truth;
- Level 1 soft/bounded surfaces for account objects;
- flat rows for activity/history;
- semantic surfaces for error/blocked states;
- mostly flat navigation links;
- no new radius, shadow, or color tokens unless a measured shared-system gap is found.

The current nested scan surface plus flat rows can be simplified: keep one collection boundary or use separated object surfaces, but avoid an outer card containing visually indistinct rows that still read as transactions. Account detail heroes should be bounded but not compete with the Money summary through repeated large shadows.

### Spacing, controls, and icons

Keep the existing constrained 440px shell and mobile-first spacing. Preserve the shared SectionHeader contract, one primary action per section, and minimum 44px interactive targets. Use AppIcon and the existing finance/action registries; do not switch icon libraries or add provider logos. Keep icon containers semantic and quiet.

### Color

Retain semantic account-family tones and debt/warning states. Avoid a rainbow dashboard or provider-color decoration. Validate light and dark tokens for border contrast, disabled controls, danger actions, and account-family distinction. The screen should remain understandable without color.

## O. States

### Empty states

The no-account state is directionally correct: it explains where money is held and offers Add account. Preserve the account-first decision and do not route a first-time user into Transactions before an account exists. Do not add a large marketing illustration.

Distinguish these cases if the domain can provide them:

- no accounts have ever been created;
- no active accounts remain because all are archived;
- account list loaded successfully but is empty;
- account list failed to load.

If the current read model cannot distinguish “never created” from “all archived”, do not fabricate a distinction; list it as a product/data-contract decision.

### Loading

Money has a useful hero + account skeleton. Keep it aligned with the final hierarchy and avoid animating financial values. If Accounts becomes a real route, give it a route-specific loading boundary; if the hub remains canonical, do not add duplicate loading infrastructure.

### Whole-screen failure and partial failure

The Money page currently treats either real-position or card-list failure as a whole-page load failure. This is safe but coarse: a card query failure can hide otherwise usable liquid accounts, and a position failure can make the summary unavailable while the object list might still be useful. Prefer the smallest partial-state improvement supported by existing query contracts: preserve successful sections and give the failed section a retry/status surface. Do not invent stale/fresh metadata.

Account detail currently conflates several conditions:

- missing/archived account;
- permission or membership failure;
- account read failure;
- recent activity read failure.

At minimum, do not render “No activity” for a failed activity read. Use the shared error/retry pattern when the query returns an error, and reserve empty copy for a successful empty result.

### Offline/read-only

The shared `MutationOfflineBanner` correctly tells users that Money changes need a connection while reading remains available. Keep create/edit/archive disabled or blocked while offline. Avoid “Connect” language unless a provider connection actually exists. Do not invent offline freshness claims.

## P. Motion

Current Money uses three independent `MotionReveal` regions on the landing page and multiple reveals on account detail. The shared reveal uses `motion/react`, in-view observers, and shared presets. Browser inspection did not show console errors.

Recommended restrained motion:

- at most one page-level reveal for the initial Money content, consistent with Home 07D;
- no per-account entrance stagger;
- no count-up, rolling, or animated financial values;
- no animated balance changes that could imply a calculation or transaction;
- retain shared press feedback and HeroUI sheet/dialog transitions;
- use purposeful opacity/state transitions for loading, retry, archive confirmation, and receipt states;
- inherit reduced-motion and low-end-device behavior from the motion foundation.

The current account collection is a financial-object collection, not a showcase. Static account objects make scanning faster and avoid dramatic cascading. Removing redundant observers is a small cleanup, not a reason for a new motion abstraction.

## Q. Accessibility

### P0

- **Privacy leakage:** Money account rows, composition, credit-card values, and detail values remain exposed when the global privacy mode is enabled. Raw values also risk appearing in accessible names. Render all financial values through `FinancialValue`/`Balance`/`Amount` leaves and verify the masked DOM and accessibility tree.

### P1

- **Touch targets:** the account-create SectionHeader action uses `min-h-9`, and the retry affordance is a text link. Ensure all actionable controls meet the shared 44px target, including icon-only overflow actions.
- **Object names:** account links need stable names composed from account identity/type and a privacy-safe balance description. Do not concatenate raw financial strings into hidden-mode labels.
- **Value semantics:** label normal balances as ledger/account balances, not available balances, unless the domain contract supports availability. Distinguish card outstanding, available credit, limit, and due amounts.
- **Form architecture:** use shared field labels, descriptions, validation relationships, focus behavior, and an accessible error summary/first-invalid focus where the existing form pattern supports it.
- **Edit reset:** closing/canceling the management sheet must discard abandoned edit state and restore persisted values on reopen.
- **Color independence:** account families and statuses must be identifiable by text/icon/structure, not hue alone.
- **Destructive action:** archive confirmation must clearly explain preservation/removal effects and keep focus within the modal/sheet.
- **Long values:** test large VND values and long Vietnamese account names at 390/440px; avoid clipping or forcing the balance to overlap identity text.

### P2

- Normalize group-label case and tracking if uppercase headings conflict with the canonical section-header voice.
- Reduce routine ownership/status badge repetition where the text is already obvious and no decision depends on it.
- Verify focus order across top bar, object, quick action, activity link, and bottom navigation in both themes.

## R. Responsive/dark mode

### Browser-verified responsive behavior

Authenticated in-app browser inspection verified the constrained product canvas and no horizontal overflow:

| Viewport | Product main width | Main x position | Account scan width | Result                 |
| -------: | -----------------: | --------------: | -----------------: | ---------------------- |
|    390px |              390px |             0px |              358px | No overflow            |
|    440px |              440px |             0px |              408px | No overflow            |
|    768px |              440px |           164px |              408px | Centered single column |
|   1280px |              440px |           420px |              408px | Centered single column |

This confirms the intentional 440px shell and no Bento grid or desktop columns. Bottom navigation did not overlap the inspected content.

### Remaining responsive risks

The fixture did not contain synthetic extreme account names or maximum-length balances. Before implementation completion, verify at 390px and 440px with:

- long Vietnamese and English account names;
- large VND values and long currency output;
- multiple group headings;
- credit-card due/attention copy;
- create/edit validation errors;
- offline banner plus bottom navigation;
- 768px and 1280px centered shell behavior.

Do not widen the desktop layout or introduce columns. Solve wrapping, truncation, and hierarchy within the existing shell and token system.

### Dark mode

The authenticated 390px inspection showed a coherent dark Money surface: the emphasized summary, account collection, account object, credit-card object, and bottom navigation remained distinguishable; provider colors were not used; no neon debt treatment was observed. Source styles use semantic tokens rather than a separate dark system.

Implementation regression should still check light mode independently and verify:

- account bounded surfaces do not merge into the page background;
- borders remain visible without becoming heavy;
- balance hierarchy survives dark contrast;
- debt/warning tones do not become neon or imply decoration;
- disabled form controls and archive actions retain contrast;
- masked values remain visually and accessibly masked;
- HeroUI sheets/dialogs and focus rings remain visible.

## S. Performance

Concrete observations only:

- Money loads real position and credit cards in one `Promise.all`; the view model is a pure transformation. There is no evidence of a need for a data-layer rewrite.
- The hub builds account rows more than once in the page/view-model path. This is a small repeated transformation; remove only if the next UI change touches that path or a profile shows it matters.
- Multiple `MotionReveal` instances create multiple observers on Money and detail. Consolidating to one page-level reveal is both the motion recommendation and the only concrete observer reduction needed.
- Account detail loads account, recent transactions, and account list in parallel. No speculative memoization or client cache should be introduced from this audit.
- The icon registry and form state are not demonstrably performance bottlenecks. Do not rewrite them or add memoization without measurement.

## T. Product decisions required

Only these decisions are blocked by current domain/product ambiguity:

1. **Accounts route ownership:** Is `/money` the canonical Accounts scan surface, or should `/money/accounts` become a distinct list route as described by canonical IA? If consolidated, define the meaning of “See all accounts”.
2. **User-facing balance term:** Does the product have an authoritative available-bank balance, or should account detail say “Balance”/“Ledger balance”? Current implementation supports the latter.
3. **Archived account lifecycle:** Should archived accounts be discoverable/read-only or restorable later? Current behavior is soft archive with preserved history but no restore path.
4. **Active-empty semantics:** Can the domain distinguish never-created accounts from an all-archived account set? If not, use one safe empty state.
5. **Opening-balance preview:** Is a preview required and supported by the existing command/read model, or is the current explanatory hint sufficient? Do not alter schema until this is decided.
6. **Investment/savings destinations:** Are the related links authoritative destinations today, or should unsupported/unpopulated product links be demoted until their product contracts are ready? Do not invent Money metrics for them.
7. **English/Vietnamese canonical copy:** Approve the user-facing vocabulary for Real Position/Real Ledger, checking vs bank, available balance, and loan/installment before rewriting locale keys.

## U. Implementation plan

Sequence the next implementation in small, verifiable batches:

### Batch 1 — Money IA and content cleanup

- Resolve Accounts route ownership and the “See all accounts” destination.
- Keep Money’s single authoritative summary but separate/demote composition so it does not duplicate Home’s dashboard hierarchy.
- Keep Home responsible for flows, spending, Inbox, and Plan.
- Rewrite only approved key-level copy in EN/VI after terminology decisions; do not change form schema or product scope.
- Keep one primary Add account action and remove “Connect” implication if no connection exists.

### Batch 2 — Shared financial privacy coverage

- Reuse the existing global `FinancialPrivacyProvider` and `FinancialValue`.
- Replace raw monetary labels in account rows, credit-card cards, composition, normal detail, and credit-card detail with the appropriate `Balance` or `Amount` primitive.
- Make parent accessible names privacy-safe and verify masked DOM/accessibility output.
- Keep names, types, counts, dates, percentages, and statuses visible.

### Batch 3 — Account object visual pattern and list

- Establish one soft/bounded Account object treatment using existing `FinancialProductCard`/shared surface contracts and tokens.
- Keep transaction rows flat and account objects bounded; remove unnecessary nested heaviness.
- Retain domain-backed dynamic grouping and separate credit-card liability objects.
- Preserve the four-item hub preview only if its destination is real.
- Restore the shared 44px action target and test long names/amounts.

### Batch 4 — Empty/loading/error/offline states

- Preserve the account-first empty state with one Add account action.
- Distinguish successful empty from failed reads, especially recent activity.
- If query contracts allow it, isolate partial Money failures rather than hiding successful sections behind one whole-screen failure.
- Reuse existing `StatusAlert`, `ErrorState`, `EmptyState`, loading, and offline patterns; add no new state system.

### Batch 5 — Create/edit form consistency

- Keep the current schema and type-specific fields.
- Align edit with the shared RHF/field architecture and HeroUI-backed select pattern.
- Reset edit state on close/cancel; reopen from persisted values.
- Improve existing error mapping and focus behavior.
- Use household currency for the success receipt.
- Add the opening-balance preview only if Batch 1 product/domain decision confirms it.

### Batch 6 — Account detail and actions

- Use the privacy-aware balance primitives and correct balance terminology.
- Keep identity → balance → metadata → contextual primary action → recent history.
- Keep card debt semantics separate from liquid balance semantics.
- Preserve archive confirmation copy and behavior; do not introduce delete.
- Decide how missing/archived/error states are surfaced without treating read failure as “not found”.

### Batch 7 — Motion and accessibility cleanup

- Consolidate redundant page-level reveals; keep account objects and financial values static.
- Verify reduced-motion behavior and shared HeroUI transitions.
- Close P0 privacy and P1 target/form/name/focus issues.
- Ensure color-independent type recognition and destructive-action semantics.

### Batch 8 — Browser regression

Run authenticated browser checks for Money Hub, create, edit, archive, normal detail, and credit-card detail at 390px, 440px, 768px, and 1280px, in light/dark themes and with reduced motion. Include visible and hidden financial values, empty/loading/error/offline states, long names/balances, English/Vietnamese copy, keyboard focus, and bottom-navigation clearance. Keep the existing credential-gated E2E coverage and add only the smallest regression assertions for the confirmed fixes.

No work in this audit authorizes implementing Transactions, Savings, Debt, Investments, schema changes, new dependencies, a new navigation model, or a separate dark design system.
