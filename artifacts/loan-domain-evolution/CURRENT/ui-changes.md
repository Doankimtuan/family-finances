# UI Changes

## Create

- Separate **Repayment strategy** (Equal Monthly / Declining Balance) and **Interest strategy** (Fixed / Promo Fixed→Floating / Floating).
- Conditional rate fields; promo shows fixed rate, months, floating rate, optional change date.
- Live simulation: monthly payment, total interest, total repayment, end date.
- Promo: “Interest changes after N months” + estimated payment after change.

## List

- Method badge includes repayment + interest strategy; APR when present.

## Detail

- Summary: strategy, current rate, promo switch date.
- **Edit Interest** (floating / post-promo only) regenerates upcoming schedule only.
- Rate history list (immutable periods).
- Schedule timeline + Record Payment / Pay Early / Edit metadata / Close.

## i18n

`money.loansPage` / `money.loanDetail` — strategy labels, promo simulation, rate history.
