# Implementation 05 — Row Semantics & Behavior Specification

**Phase**: Implementation 05 — Shared Financial & Row Components  
**Standard**: Task 11 / Warm Precision

---

## 1. Row Classification & Behavior Matrix

| Component           | Static / Interactive                 | Main Action              | Secondary Action       | Leading Slot                | Trailing Slot                | Divider Behavior            |
| :------------------ | :----------------------------------- | :----------------------- | :--------------------- | :-------------------------- | :--------------------------- | :-------------------------- |
| **BaseRow**         | Configurable via `href` / `onPress`  | Navigation or Select     | Action slot            | 32px or 40px container      | Custom content               | Inset (56px), Full, or None |
| **NavigationRow**   | Interactive (`<Link>` or `<button>`) | Navigate to subpage      | None                   | 32px or 40px icon           | Badge + Forward Chevron      | Inset (56px) default        |
| **KeyValueRow**     | Static (`<dl>` item)                 | None                     | Copy button (optional) | None                        | Tabular value                | Inset (0px) or None         |
| **FinancialRow**    | Configurable                         | Open detail modal / page | Optional menu          | 40px icon container         | Financial amount + subtitle  | Inset (56px) default        |
| **TransactionRow**  | Interactive (`<Link>` or `<button>`) | Open transaction detail  | None                   | 32px category icon (10px r) | Signed amount + account/date | Inset (56px) default        |
| **AccountRow**      | Interactive (`<Link>`)               | Open account ledger      | More menu (decoupled)  | 40px provider logo (10px r) | Balance / Limit + mask       | Inset (56px) default        |
| **SavingsRow**      | Interactive (`<Link>`)               | Open savings contract    | None                   | 40px bank logo / icon       | Principal + Interest rate    | Inset (56px) default        |
| **InvestmentRow**   | Interactive (`<Link>`)               | Open asset position      | Quick buy/sell         | 40px asset ticker icon      | Market value + Gain/loss     | Inset (56px) default        |
| **LoanRow**         | Interactive (`<Link>`)               | Open loan schedule       | Pay installment        | 40px lender logo            | Outstanding debt + next date | Inset (56px) default        |
| **PersonalDebtRow** | Interactive (`<Link>`)               | Open debt detail         | Log payment            | 40px counterparty avatar    | Amount + Direction label     | Inset (56px) default        |
| **InboxRow**        | Interactive (`<Link>`)               | Open decision sheet      | Resolve inline         | 3px urgency accent bar      | Impact amount + chevron      | Inset (16px)                |
| **MemberRow**       | Interactive or Static                | View member impact       | Role switcher / Remove | 40px avatar with initials   | Role badge + action button   | Inset (56px) default        |
| **ProviderRow**     | Interactive (`<button>`)             | Select provider          | External link          | 40px official provider logo | Selection check / arrow      | Inset (56px) default        |
| **StatusRow**       | Static presentation                  | None                     | Retry / Fix action     | 32px status icon            | Action CTA or timestamp      | None                        |

---

## 2. Accessibility & Keyboard Rules

1. **Semantic Elements**:
   - Navigation rows with `href` MUST render as `<Link href="...">` with accessible label.
   - Interactive rows without `href` MUST render as `<button type="button">`.
   - Key-value items render within `<dl>`, `<dt>`, and `<dd>` semantics.
   - List collections render within `<ul>` and `<li>` items.
2. **Keyboard Navigation**:
   - `Tab` focuses the interactive row with standard focus ring (`outline-2 outline-offset-2 outline-focus-ring`).
   - `Enter` / `Space` activates the row.
3. **Screen Reader Announcements**:
   - When privacy mode is active, the screen reader does not announce fake masked symbols as numbers; the accessible name announces `"Số dư được ẩn"` or uses privacy-safe descriptions.
   - Transaction rows announce explicit semantic transaction type: `"Khoản chi: 85.000 đồng"` or `"Khoản thu: 15.000.000 đồng"` or `"Chuyển khoản: 2.000.000 đồng"`.
4. **Touch Target Guarantee**:
   - Even when visual row content is compact, the interactive bounding box enforces `min-height: 48px` (or `44px` on mobile with expanders) to satisfy WCAG AA 2.5.5 / 2.5.8.
