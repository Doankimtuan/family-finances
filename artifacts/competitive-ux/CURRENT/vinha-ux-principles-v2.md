# ViNha UX Principles V2 — Draft

**Status:** Proposed draft for future redesign phases.  
**Does not overwrite:** `.agents/design-system.md`, `artifacts/ux-redesign/CURRENT/ux-principles.md`, or `artifacts/design-system-evolution/CURRENT/design-principles.md`.

These 14 principles synthesize competitive research with existing ViNha contracts. They are additive guidance for presentation and interaction, not new domain rules.

Existing canonical rules that remain in force:

- One primary purpose per screen
- One primary action per state
- Progressive disclosure
- Real ledger vs plan intention must stay visually distinct
- Confirm by consequence, not by habit
- Health is read-only

---

## 1. Answer one household question first

**Why it matters**  
Households open an app to reduce uncertainty, not to inventory widgets. Monarch can feel like a command center; it also fails when the first screen does not answer a takeaway.

**Example**  
Home answers “How is the household doing this period, and what needs attention?” Money answers “Where is our money and what needs managing?”

**Do**  
Lead every hub with one labeled question and one dominant fact.

**Don't**  
Open with equal-weight cards for cash flow, investments, bills, net worth, advice, and referrals.

---

## 2. Show meaning before complexity

**Why it matters**  
Financial information without context creates cognitive load. Users cannot act on unlabeled numbers.

**Example**  
“Chi tiêu tháng này” + amount + comparison to last period, not a naked figure.

**Do**  
Explain what the number is, why it matters, and whether it is current state, movement, intention, or estimate.

**Don't**  
Expose multiple equal-weight metrics without labels, source, or freshness.

---

## 3. Separate reality from intention

**Why it matters**  
ViNha’s core trust contract. Competitors blur this: Monzo Pots hold cash; YNAB categories hold assigned dollars; Copilot “Free to Spend” mixes budget leftover with cash.

**Example**  
Money hero = accessible liquid account total. Plan hero = planned intention. Hũ progress = budget vs actual, never bank balance.

**Do**  
Use `Balance` for ledger cash and `Amount` / `FinancialValue` for intention, estimates, and liabilities.

**Don't**  
Present Hũ totals, goal funded amounts, or estimated investment value as spendable cash.

---

## 4. Ask for the minimum, then disclose

**Why it matters**  
Daily capture dies when every field is equally required. Monzo and Copilot keep the common path short; YNAB and loan setup can over-ask.

**Example**  
Add Transaction: type → amount → account → optional category / date / note. Inbox owns unresolved review.

**Do**  
Required fields first. Collapse optional detail. Default date to today.

**Don't**  
Force category perfection, attachments, tags, or split logic on the common path.

---

## 5. Attention is a queue, not a feed

**Why it matters**  
Monarch’s assign-for-review and Copilot’s To Review work because they convert noise into a finishable list. Generic notification feeds do not.

**Example**  
Inbox is the household attention center. Home may preview pending count; it must not become a second inbox.

**Do**  
One decision per review item. Return to queue position. Empty state: “No decisions needed.”

**Don't**  
Mix marketing alerts, referral prompts, or completed onboarding steps into the attention surface.

---

## 6. Household context before personal inventory

**Why it matters**  
Monarch’s strongest advantage is a shared operating picture. Copilot’s polish does not compensate for shared-login collaboration.

**Example**  
Home and Together show household identity, Admin/Partner responsibility, and shared next work before personal account lists.

**Do**  
Make shared visibility, ownership badges, and partner-visible consequences explicit.

**Don't**  
Import Copilot-style magic-link sharing, hide accounts unless the domain already supports it, or describe Admin as financial ownership.

---

## 7. Scan first, then detail

**Why it matters**  
Copilot proves density and comprehension can coexist when rows have a stable anatomy: identity, meaning, amount.

**Example**  
`TransactionRow`: icon + title + meta + tabular amount. Account scan: name/type + balance + ownership.

**Do**  
Keep list density medium. Group by existing axes (date). Preserve scroll position.

**Don't**  
Use one card per row, desktop filter panels, or unlabeled color as the only amount cue.

---

## 8. One hero, one primary action

**Why it matters**  
Equal CTA weight is a documented ViNha anti-pattern and a Monarch dashboard failure mode.

**Example**  
Account detail: one balance hero, one “Add transaction” primary, overflow for archive.

**Do**  
One `Card tone="hero"` max. One primary button per state. High-frequency create uses `FloatingAction`.

**Don't**  
Stack Pay / Transfer / Edit / Archive / Share as equal primaries.

---

## 9. Plan is a decision, not a tracker

**Why it matters**  
YNAB’s power is not its grid. It is the habit of giving money a job. ViNha already owns this philosophy (“Give every đồng a job”).

**Example**  
Plan hub: what is funded, what is underfunded, what recurring is coming, what Ritual needs.

**Do**  
Show progress from real domain ratios. Make funding/reallocation a deliberate act with preview.

**Don't**  
Import YNAB’s category-grid architecture, Ready to Assign ledger, or Age of Money.

---

## 10. Speed on the common path, ceremony on consequence

**Why it matters**  
Monzo is fast because harmless actions are light. YNAB and ViNha confirmation models protect trust when money or partners are affected.

**Example**  
Save a today’s grocery expense: no preview. Settle a matured savings product: preview-confirm with principal / tax / received.

**Do**  
Match confirmation level to `financial-confirmation-model.md`. Show receipts when money, plan, or a decision changed.

**Don't**  
Confirm every tap. Silently mutate real money. Downgrade preview-confirm for visual simplicity.

---

## 11. Sheets extend the screen; pages own complexity

**Why it matters**  
Monzo bottom sheets keep mobile flow continuous. They fail when used as multi-step product wizards.

**Example**  
Create account in a sheet. Create loan / savings / investment as existing page wizards.

**Do**  
Preserve current overlay type. Sticky footer. Keyboard never hides amount or CTA. Close discards ephemeral create state.

**Don't**  
Replace a Sheet with a page because Copilot uses a page, or stack Motion on HeroUI drawers.

---

## 12. Calm premium, not cinematic finance

**Why it matters**  
Copilot’s midnight canvas and floating tags are distinctive — and not ViNha. Premium for ViNha is restraint, tabular money, and warm-stone calm.

**Example**  
Deep teal used for primary action and one hero. Semantic color only for movement and attention.

**Do**  
Medium density. Warm surfaces. Geist + tabular numerals. Motion as feedback, never as decoration.

**Don't**  
Dark-space marketing aesthetics, candy category tags, animated money digits, or neon module colors.

---

## 13. Empty states invite one valid next step

**Why it matters**  
Day-zero users hesitate when Home exposes every module. Monarch’s persistent Getting Started widget is a negative example.

**Example**  
New Home: add account, starter plan, invite later. Module rows on Money: “None yet”, still navigable.

**Do**  
One next action. Real empty states. No seeded fake money.

**Don't**  
Keep completed onboarding chrome. Large illustrations by default. “Coming soon” disabled actions.

---

## 14. Label the kind of money

**Why it matters**  
The most common competitive failure is unlabeled aggregates: net worth, free to spend, total money, available disposable income.

**Example**  
“Estimated market value · not cash · as of 8 Sep”. “Accessible money · active liquid accounts”. “Planned this month · intention, not bank balance”.

**Do**  
Every amount carries meaning: available, due, expected, estimated, realized, unrealized, planned.

**Don't**  
Invent net worth, total money, or a Reports destination to make a number feel complete.
