# Mobile Experience

## Assessment

The mobile-first foundation is appropriate: 440px AppViewport, fixed bottom navigation, single-column screens, safe areas, and one-handed interaction. The UX risk lies in dense finance forms and lower-screen thumb reach.

## Mobile Review

| Area | Assessment | Risk |
|------|------------|------|
| Thumb reach | Good with bottom nav and primary CTAs | Top-heavy actions may be hard one-handed |
| Large forms | Moderate | Savings/loan/card setup can become long |
| Keyboard flow | Needs strict QA | Amount entry, category selection, notes, and save must not fight keyboard |
| Bottom navigation | Strong | Five items is the maximum comfortable set |
| Progressive disclosure | Required | Advanced financial fields should not appear in common path |
| Scrolling fatigue | Moderate | Hubs and detail screens need compact hierarchy |

## Recommendations

### PX-MO-01: Sticky mobile action bar for long forms

Problem: Long setup forms can push primary submit out of reach.

User Impact: Users scroll repeatedly or abandon setup.

Affected Screens: Transaction Add, Savings setup, Loan setup, Card setup, Together Policies.

Frequency: Daily/Event-based.

Business Impact: Medium.

Recommended UX: Use a viewport-confined sticky action area for Save/Continue/Resolve, with disabled state and inline error jump.

Implementation Cost: Medium.

Priority: P1.

### PX-MO-02: Required-first form sections

Problem: Financial setup has many useful but non-essential fields.

User Impact: Mobile forms feel too long.

Affected Screens: Accounts, Savings, Debts/Loans, Cards, Recurring, Goals.

Frequency: Event-based.

Business Impact: Medium activation and data-completeness impact.

Recommended UX: Put required fields first, collapse optional details, and allow later completion when financial safety permits.

Implementation Cost: Medium.

Priority: P1.

