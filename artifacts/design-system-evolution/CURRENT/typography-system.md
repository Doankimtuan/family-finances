# Typography System

## Fonts

- Sans: Geist Sans.
- Mono: Geist Mono.
- Numerals: tabular numerals for money, percentages, dates, schedules, balances, and identifiers where alignment matters.

## Roles

| Role | Use | Guidance |
|---|---|---|
| Display | Rare onboarding or empty-state headline. | 30-34px mobile, semibold, tight but readable. |
| Page title | Screen identity. | 24-30px mobile, semibold, short. |
| Section title | Region identity. | 18-22px, semibold. |
| Body | Main explanation. | 15-16px, relaxed line height. |
| Caption | Source, helper, metadata. | 12-13px, secondary tone. |
| Money amount | Financial value. | Tabular, semibold only when dominant. |
| Percentage | Progress or rate. | Tabular, smaller than money unless it is the key fact. |
| Date | Due, maturity, posted, effective. | Tabular where aligned in lists. |
| Metadata | Source, freshness, owner, state. | Compact, secondary, not all caps by default. |
| Debug/ID | Technical identifiers. | Geist Mono, extra small, hidden from normal UI unless needed. |

## Money Hierarchy

Not every amount is a headline. Use three levels:

- Dominant amount: the one amount the section is about.
- Supporting amount: related fact in row or preview.
- Metadata amount: fee, interest, source estimate, or previous value.

Amounts must include visible or accessible meaning. Screen readers must receive the meaning, not just the formatted number.

## Copy Constraints

- Keep CTA labels short and translatable.
- Avoid idioms that do not translate cleanly.
- Use consistent nouns across English and Vietnamese.
- Do not use guilt, shame, investment advice, or hype.

