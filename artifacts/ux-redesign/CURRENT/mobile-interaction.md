# Mobile Interaction

## Mobile Contract

- Desktop continues to render inside the constrained mobile viewport.
- Primary actions live within thumb reach, preferably bottom/sticky for long flows.
- Bottom navigation remains fixed and safe-area aware.
- Inputs follow natural order: amount/source/destination/date/meaning/detail.
- Keyboard opening must not hide the active field or submit action.
- Touch targets meet minimum 44px.
- Long lists preserve scroll position.
- Sheets should not exceed comfortable reading height; complex flows use pages.
- Back returns to owner parent or preserved origin.
- Familiar money capture should be achievable in about 15 seconds.

## One-Handed Capture

Fast transaction capture sequence:

```text
Open capture -> choose income/expense/transfer -> amount -> account(s) -> category/date if needed -> save
```

Rules:

- Default to today.
- Remember last-used account/category where safe.
- Keep note/attachment optional.
- Show warnings only when necessary.
- Do not force category perfection; use Inbox/review where approved.

## Long-Form Mobile Rules

- Use progressive steps for loans, savings, cards, investments.
- Each step has one question.
- Sticky action bar shows Continue/Save/Confirm.
- Inline error summary jumps to first invalid field.
- Exit protection appears only after user entered meaningful data.

## Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Large setup forms push actions out of reach. | Abandonment, repeated scrolling. | Sticky action bar and required-first steps. | Loans, Savings, Cards, Investments, Policies | P1 |
| Keyboard behavior can break capture speed. | Capture exceeds daily-use tolerance. | Test amount/date/category focus order and safe action visibility. | Transactions | P0 |
| Cross-module return can lose scroll position. | Users lose context. | Preserve origin route and list position. | Inbox, Account, Health, Home | P1 |

