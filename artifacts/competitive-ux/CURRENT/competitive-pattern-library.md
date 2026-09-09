# Competitive Pattern Library

Each pattern is a **mechanism**, not a screenshot to clone.

Decisions: **ADOPT** | **ADAPT** | **REJECT** | **DEFER**

Related durable IDs live in `competitive-decision-log.md`.

---

## P0 — Fundamental (application-wide)

### P0-01 Household operating picture

```text
Reference: Monarch
Pattern: One shared household view of accounts, budgets, and review — each member has a login.
User problem: Couples cannot keep a shared picture without screenshots or a shared password.
Behavioral mechanism: Shared facts reduce coordination cost; review happens on the same numbers.
UX principle: Household context before personal inventory.
ViNha applicability: YES — Together + Home already exist.
ViNha adaptation: Lead Home/Together with household identity and next shared work; keep Admin/Partner as responsibility, not ownership.
Conflict: None if hide-account is not invented. Monarch cannot hide accounts (Verified Shared Views).
Decision: ADAPT
```

### P0-02 One question, one hero, one primary action

```text
Reference: Copilot (when focused); Monzo Add money; ViNha SoT
Pattern: A first screen answers one question with one dominant number and one obvious action.
User problem: Equal widgets force users to assemble meaning.
Behavioral mechanism: Attention is serial. Hierarchy creates confidence.
UX principle: Answer one household question first; one hero, one primary action.
ViNha applicability: YES — already contracted; execution is the gap (Analyst: Monarch fails this).
ViNha adaptation: Apply per hub recipe. Home ≠ Money ≠ Plan questions.
Conflict: None.
Decision: ADOPT
```

### P0-03 Reality vs intention visual split

```text
Reference: YNAB (assigned vs account); Monzo (Pots vs main) as a negative domain example
Pattern: Users must see whether a number is cash, plan, estimate, or due.
User problem: People spend estimates and envelope totals.
Behavioral mechanism: Labels + component choice (Balance vs Amount) prevent category errors.
UX principle: Separate reality from intention; label the kind of money.
ViNha applicability: YES — core contract.
ViNha adaptation: Never present Hũ, Goals, or estimated investments as spendable cash.
Conflict: Importing Pots or Free to Spend would break this.
Decision: ADOPT (ViNha-native; competitors are warnings)
```

### P0-04 Progressive disclosure / minimum common path

```text
Reference: Monzo
Pattern: Fast capture with progressive disclosure. Amount → source → destination → review; extra context in sheets.
User problem: Users want to record or move money without a long form.
Behavioral mechanism: Completion bias — short path finishes; optional fields after the save-worthy core.
UX principle: Ask for the minimum information required to complete the common path.
ViNha: ADAPT
Implementation implication: Amount → account → type → optional category/date/note (preserve existing validation order if the form already differs — do not reshuffle domain-required fields).
Constraint: Preserve existing ViNha transaction validation and flow; Inbox owns unresolved review.
Conflict: None if overlay type stays.
Decision: ADAPT
```

### P0-05 Attention as a finishable queue

```text
Reference: Monarch needs-review loop; Copilot To Review
Pattern: Unresolved items are a countable queue with mark-done, skip, or decide — not a notification firehose.
User problem: Financial anxiety from unbounded activity lists.
Behavioral mechanism: Zeigarnik + closure: a queue that can reach zero is calming.
UX principle: Attention is a queue, not a feed.
ViNha applicability: YES — Inbox.
ViNha adaptation: Home may show pending count; the work happens in Inbox. Empty: “No decisions needed.”
Conflict: A Copilot review-dot system on Transactions would duplicate Inbox unless the ledger already has review state.
Decision: ADAPT
```

### P0-06 Transaction scan anatomy

```text
Reference: Copilot
Pattern: Every row is identity + meaning + tabular amount, with a small state cue (review dot).
User problem: History is unreadable, so users stop reviewing.
Behavioral mechanism: Consistent columns enable pre-attentive scan of amount and merchant.
UX principle: Scan first, then detail.
ViNha applicability: YES — TransactionRow exists.
ViNha adaptation: Medium density; tone + label, not color-only; map “needs attention” to Inbox/uncategorized — not a new dot language unless it already exists.
Conflict: None.
Decision: ADAPT
```

### P0-07 Mobile interaction model (thumb, sheets, 440px)

```text
Reference: Monzo
Pattern: Primary actions in thumb reach; sheets for extra context; one-column mobile even when the device is large.
User problem: Desktop finance UIs fail one-handed.
Behavioral mechanism: Reduced travel + stable overlay physics = faster completion.
UX principle: Sheets extend the screen; pages own complexity.
ViNha applicability: YES — AppViewport, Sheet, BottomActionBar, FAB.
ViNha adaptation: Keep current Sheet vs page choices. Keyboard must not hide amount/CTA.
Conflict: Monarch web-first habits.
Decision: ADOPT
```

### P0-08 Planning orientation (money has a job)

```text
Reference: YNAB
Pattern: Before spending, users answer what the money is for; progress bars reflect funding decisions.
User problem: Tracking without planning produces guilt and surprise bills.
Behavioral mechanism: Pre-commitment + visible leftover question.
UX principle: Plan is a decision, not a tracker.
ViNha applicability: YES — Hũ, Goals, Ritual already encode this.
ViNha adaptation: Plan hub and Ritual should ask YNAB’s questions in ViNha language. Do not import the grid.
Conflict: Ready to Assign / Age of Money would be new domain.
Decision: ADAPT
```

### P0-09 Financial number hierarchy

```text
Reference: Copilot hero numbers; ViNha typography scale
Pattern: Dominant amount → supporting amount → metadata amount; tabular numerals.
User problem: All figures shout; none are believed.
Behavioral mechanism: Size/weight encode importance faster than color.
UX principle: Show meaning before complexity.
ViNha applicability: YES — Balance hero / Amount / meta.
ViNha adaptation: One dominant number per section.
Conflict: None.
Decision: ADOPT
```

---

## P1 — High impact (important workflows)

### P1-01 Capture speed ergonomics

```text
Reference: Monzo
Pattern: Numeric-first amount, sticky confirm, method branching after one CTA.
User problem: Daily capture exceeds patience.
Behavioral mechanism: Defaults (today, last account) remove decisions.
UX principle: Speed on the common path.
ViNha applicability: YES — ~15s target already.
ViNha adaptation: Required-first; optional collapsed; FAB always present.
Conflict: None.
Decision: ADAPT
```

### P1-02 Filter chips instead of filter panels

```text
Reference: Copilot
Pattern: Stackable chips (account, category, date, type) on the list itself.
User problem: Finding a transaction on a phone.
Behavioral mechanism: Filters stay in context; results update in place.
UX principle: Scan first, then detail.
ViNha applicability: YES — S8 already specifies chips.
ViNha adaptation: Implement/polish chips; skip Review Status unless domain has it.
Conflict: Desktop filter panel would break 440px.
Decision: ADAPT
```

### P1-03 Review loop from a banner, return to origin

```text
Reference: Monarch “Let’s review some transactions” banner + swipe
Pattern: Home/Dashboard launches a focused review, then returns.
User problem: Users see that work exists but don’t start.
Behavioral mechanism: A single entry reduces initiation friction.
UX principle: Attention is a queue.
ViNha applicability: YES if the banner routes to Inbox (or an existing review flow).
ViNha adaptation: Attention card on Home → Inbox queue, preserve position (already P1 in UX contract).
Conflict: Building a swipe-categorize product would change flows.
Decision: ADAPT
```

### P1-04 Account / liability detail heroes

```text
Reference: Monarch account seriousness; ViNha S4
Pattern: Detail opens on the one number that defines the object (cash balance vs outstanding).
User problem: Card debt looks like a bank balance.
Behavioral mechanism: Caption + component choice (Amount vs Balance) prevent misread.
UX principle: Label the kind of money.
ViNha applicability: YES — FinancialAccountHero, credit outstanding pattern.
ViNha adaptation: Keep liability-first card hero; never green/red static balances.
Conflict: None.
Decision: ADOPT
```

### P1-05 Goal / Hũ progress as evidence

```text
Reference: YNAB targets; Monzo Pot fill (interaction only)
Pattern: Progress ratio comes from real funded vs target; underfunded is a prompt.
User problem: Decorative bars create fake confidence.
Behavioral mechanism: Honest ratios support decisions (contribute, reallocate, wait).
UX principle: Plan is a decision, not a tracker.
ViNha applicability: YES — GoalCard, JarCard, Progress.
ViNha adaptation: Overspent labeled; paused/archived calm.
Conflict: Fake ratios forbidden.
Decision: ADOPT
```

### P1-06 Upcoming recurring visibility

```text
Reference: Copilot Upcoming strip; Monzo bills calendar; Monarch recurring calendar
Pattern: Next expected items are visible without opening a full schedule tool.
User problem: Surprises from known bills.
Behavioral mechanism: Prospective memory — seeing the next item reduces missed prep.
UX principle: Meaning before complexity.
ViNha applicability: YES — Recurring + Calendar exist.
ViNha adaptation: Capped upcoming preview on Plan (and optionally Home). No auto-detect unless domain has it.
Conflict: Detection review UI without detection backend.
Decision: ADAPT
```

### P1-07 Confirmation UX by consequence

```text
Reference: Monzo payment review sheets; YNAB cover-overspending; ViNha confirmation model
Pattern: Harmless saves are quiet; money/partner/irreversible actions preview effects.
User problem: Confirmation fatigue or silent mutation.
Behavioral mechanism: Trust tracks surprise. Preview prevents surprise.
UX principle: Speed on the common path, ceremony on consequence.
ViNha applicability: YES.
ViNha adaptation: Keep none / light / preview-confirm. Journey receipts after multi-domain changes.
Conflict: None.
Decision: ADOPT
```

### P1-08 Named envelope interaction (not cash pots)

```text
Reference: Monzo Pots
Pattern: Named, purposeful containers with simple add/edit/schedule actions in a sheet.
User problem: Intention is abstract if it has no object to tap.
Behavioral mechanism: Objecthood + naming increase follow-through.
UX principle: Progressive disclosure; Plan is a decision.
ViNha applicability: YES — Hũ.
ViNha adaptation: Name, kind, planned amount, progress, sheet actions. No hide/lock of ledger cash. No spend-from-Hũ.
Conflict: Direct import of Pots.
Decision: ADAPT
```

### P1-09 Recurring review of detections (conditional)

```text
Reference: Monarch Recurring Review
Pattern: New repeating merchants are proposed, not silently committed; badge + banner.
User problem: False recurring creates noise.
Behavioral mechanism: Human confirmation on uncertain automation.
UX principle: Attention as a queue.
ViNha applicability: ONLY if detection already exists.
ViNha adaptation: Inbox or Recurring review items.
Conflict: New automation capability.
Decision: DEFER (document only unless domain exists)
```

### P1-10 Similar transactions / bulk categorize (conditional)

```text
Reference: Copilot similar txns + bulk edit
Pattern: Changing one merchant offers to change siblings; long-press multi-select.
User problem: Repeat categorization toil.
Behavioral mechanism: Batch correction.
ViNha applicability: Unknown without domain support for bulk rules.
Conflict: New capability / API.
Decision: DEFER
```

---

## P2 — Polish

### P2-01 Press and sheet continuity

```text
Reference: Monzo; Copilot native motion
Pattern: Fast press scale; overlays own their motion.
User problem: UI feels dead or laggy.
ViNha adaptation: Existing shared/motion + HeroUI only. Reduced motion = opacity.
Decision: ADAPT
```

### P2-02 Review dots / quiet state cues

```text
Reference: Copilot blue/gray/red dots
Pattern: Tiny persistent cues in every list appearance of an item.
ViNha adaptation: Use existing status badges/pills; don’t add a third color language.
Decision: ADAPT (if mapped to existing states) / REJECT (new color grammar)
```

### P2-03 Chart interaction (tap segment, period swipe)

```text
Reference: Copilot Swift Charts
Pattern: Chart is explorable, not a PNG.
ViNha adaptation: Home cash-flow may keep light exploration; Money hub stays chart-free. No fabricated interpolation.
Decision: ADAPT (Home/Health only)
```

### P2-04 Typography refinement

```text
Reference: Copilot scale contrast
Pattern: Display vs whisper body.
ViNha adaptation: Stay on Geist scale; hero vs meta already specified. Don’t import Matter/Jokker or weight-100 body.
Decision: REJECT (brand fonts) / ADAPT (hierarchy discipline)
```

### P2-05 Empty-state warmth

```text
Reference: Monzo
Pattern: Short human copy + one action; light illustration optional.
ViNha adaptation: Existing EmptyState; no large illustrations by default on hubs.
Decision: ADAPT
```

### P2-06 Horizontal upcoming chips

```text
Reference: Copilot Upcoming
Pattern: Horizontal scroll of next recurrings.
ViNha adaptation: Optional on Plan hub if it doesn’t create a second calendar. Prefer a short vertical list if EN/VI labels wrap poorly.
Decision: ADAPT
```

---

## Rejected patterns (library)

| ID | Pattern | Source | Why reject |
| --- | --- | --- | --- |
| R-01 | Net Worth as Home/Money hero | Monarch, Copilot | Invented aggregate; Design SoT |
| R-02 | Reports destination/tab | Monarch | No Reports tab; analytics already placed |
| R-03 | Advice / credit score widgets | Monarch | Advice forbidden; no credit-score domain |
| R-04 | Home referral / Free Months | Copilot | Not household finance; pollutes Home |
| R-05 | Dashboard widget customization | Monarch | Card soup; one-purpose screens |
| R-06 | Pots as cash / hide-lock money | Monzo | Hũ ≠ cash |
| R-07 | YNAB category grid / Ready to Assign | YNAB | Different ledger |
| R-08 | Age of Money | YNAB | New metric |
| R-09 | Free to Spend as cash | Copilot | Mixes budget leftover and money |
| R-10 | Cinematic dark Copilot brand | Copilot | Conflicts with Calm Household Finance |
| R-11 | Magic-link household sharing | Copilot | Together already has membership |
| R-12 | Hide accounts from partner | Inverse of Monarch | Would be new ACL; Monarch itself doesn’t offer it |
| R-13 | Chart-as-entire-Home | Copilot | Home is household overview |
| R-14 | Extra bottom tabs / desktop dashboard | Monarch web | Five tabs + 440px |
| R-15 | Health buy/sell/hold | Copilot-style advice | BR-24 |

---

## Anti-patterns (competitive + ViNha SoT)

See also Design SoT §32. Competitive research adds evidence, not a replacement list.

| Pattern / problem | Why it fails | Products | ViNha avoidance |
| --- | --- | --- | --- |
| Dashboard overload | No takeaway | Monarch | Fixed Home recipe, one hero |
| Card soup | Nested stories | Monarch widgets; Monzo Pot grids | Section + rows |
| Too many metrics | User aggregates mentally | Monarch, Copilot Net+Budgets+Graph | One dominant number |
| Too many colors | Color stops meaning | Copilot candy tags | Semantic tokens only |
| Excessive charts | Decoration | Copilot temptation | One question or none |
| Hidden actions | Extra clicks to the number | Monzo Pots UI (**Community**) | Visible primary + FAB |
| Over-complex budgeting | Method intimidates | YNAB grid | Hũ/Goals |
| Leftover onboarding chrome | Setup forever | Monarch Getting Started | Auto-remove completed setup |
| Unclear terms | Misread money | All | Glossary |
| Confirmation fatigue | Blind taps | Any | Proportional model |
| Over-dense lists | Cannot scan | Monarch mobile (**Community**) | Copilot row, medium density |
| Desktop-first | Phone becomes a peephole | Monarch | 440px |
| Unclear household ownership | Shared login or silent full visibility | Copilot; Monarch full visibility | Explain visibility; don’t fake privacy |
| Misleading aggregates | Estimates as cash | Monarch/Copilot net worth | State-labeled amounts |
