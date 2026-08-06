# UX Content Guidelines

## Voice

- Calm, plain, factual.
- Vietnamese and English ready.
- No guilt, shame, pressure, or scare language.
- No investment advice or optimization language.
- No unnecessary technical banking terms.

## Canonical Terms

Use frozen glossary terms:

- Account
- Transaction
- Jar
- Category
- ReviewItem
- Plan Movement
- Emergency Declaration
- Month Ritual
- Health

Additional Phase C terminology:

- Investment holding: risk-bearing asset record.
- Estimated value: not cash; requires date/source when known.
- Realized outcome: value after exit/write-off/proceeds are known.
- Unrealized change: value movement before exit; not spendable.

## Content Behavior

| Content type | Rule |
|---|---|
| Screen title | Name the user's current task or object. |
| Field label | Say what the user must provide, not implementation field name. |
| Helper text | Explain consequence only when needed. |
| Warning | State risk, consequence, and recovery. |
| Confirmation | State what happens and whether real money changes. |
| Error | Say what failed and the next action. |
| Empty state | Provide one valid next step. |
| Success | Confirm outcome with receipt. |
| Health insight | Explain source facts and completeness. |
| Investment copy | Never say buy/sell/hold recommendation; use record/review/update/exit facts. |

## Bilingual Readiness

- Avoid idioms that do not translate.
- Keep CTA labels short.
- Use nouns consistently across English/Vietnamese.
- Amount/date strings must use localization utilities.
- Screen reader labels must include financial meaning, not only visible shorthand.

## Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Financial state labels can drift by screen. | Users relearn terms and misread amounts. | Add copy QA checklist: amount meaning, source truth, decision question, confirmation consequence. | All product screens | P0 |
| Investment language can imply advice. | Trust/compliance risk. | Use factual recording language only. | Investments, Health, Inbox | P0 |

