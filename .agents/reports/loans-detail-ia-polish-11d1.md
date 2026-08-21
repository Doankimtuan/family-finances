# Loans 11D.1 — Detail IA + i18n + Schedule Performance + Action UX

## Verdict

# LOANS DETAIL UX NOT READY

The requested implementation is in place and automated checks pass. The
configured authenticated household has no populated Loan fixture, so the
required populated overdue/payment/history browser evidence cannot be
completed honestly.

## Implemented

- Removed Loan i18n key leakage by adding missing list/detail keys and keeping
  translations scoped to their correct namespace in EN and VI.
- Replaced technical lender/implementation copy with concise user-facing copy.
- Simplified Loan cards to identity, remaining principal/progress, next
  obligation, and interest rate; remaining principal uses the debt semantic
  token and `FinancialValue`.
- Added Overview, Repayment schedule, and History & actions navigation.
- Initial schedule view renders a relevant four-entry window only; full
  schedule is a dedicated year-grouped route at `/money/loans/[id]/schedule`.
- Moved payment, payoff estimate, edit, interest edit, and create flows into
  shared ActionSheet layouts while preserving reset behavior and 11B
  idempotency.
- Kept fee rows and unsupported fee calculations absent.
- Removed the Loans list’s redundant Money back link and ownership duplication.

## Verification

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test -- --run` — PASS, 138 files / 1,016 tests.
- 11B idempotency, 11C list/create, transaction grouping, Home metrics,
  financial semantics, privacy, and i18n regression coverage — PASS within the
  full suite.
- `npm run build` — PASS; dedicated schedule route compiled.
- Authenticated browser state — available.
- EN Loans list at 440px/light and VI Loans list at 390px/dark — PASS.
- Create Loan ActionSheet in VI — PASS; no console errors.
- EN not-found Loan detail — PASS; no console errors.

## Blocking verification

The authenticated fixture contains no Loan records. Therefore these required
checks remain unverified: populated detail Overview, due/overdue states, full
schedule with 180-period source data, History & actions, payment review,
receipt/replay, payoff ActionSheet with populated context, privacy ON/OFF on
financial amounts, and populated Loan screenshots at the requested states.

No new GSAP, image, or competing UI dependency was added; the repository’s
canonical HeroUI/mobile-shell rules govern this product detail flow.
