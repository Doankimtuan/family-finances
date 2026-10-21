# Phase 3A — Regression results

## Automated checks

- Full unit suite: **PASS**, 270 test files and 1,869 tests.
- Focused invitations, plan availability, ownership RLS, and RPC ACL contract tests: **PASS**, 4 files and 35 tests.
- TypeScript typecheck: **PASS**.
- ESLint: **PASS**.
- Next.js production build: **PASS** on Next.js 16.3.1.
- Prettier check on all Phase 3A application, message, and test files: **PASS**.
- `git diff --check`: **PASS**.

The full unit run emitted existing test-environment warnings, including a missing interpolation value in a debt-payment test, HeroUI PressResponder diagnostics, and JSDOM’s unimplemented `window.scrollTo`; all 270 files and 1,869 tests passed. The browser sessions also emitted existing HeroUI and early-closed-stream diagnostics on shutdown; targeted page-error captures were empty.

## Scope and environment

No new migration was needed. No schema or RLS contract was changed. Browser writes were limited to the exact disposable test fixture and cleaned with `scripts/ownership-test-harness.mjs together-20a-cleanup`. A read-only SQL check then found zero households with the fixture name. The harness kept the pre-existing test auth identities; temporary browser scripts and the fixture credential file were removed. Pre-existing unrelated worktree changes were preserved.

## Evidence

F1 and F6 browser details and screenshots are recorded in [F1 browser verification](f1-browser-verification.md) and [F6 browser verification](f6-browser-verification.md). The implementation status and limits are in [the final verdict](final-verdict.md).
