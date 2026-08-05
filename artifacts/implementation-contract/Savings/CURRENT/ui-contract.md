# UI Behavior Contract

This file defines behavior only, not design.

## Draft

Visible actions: edit setup, initiate funding, cancel.

Disabled actions: renew, withdraw, early withdraw, archive unless cancelled.

Hidden actions: maturity decision.

Required warning: no real savings exists yet.

Confirmation: cancel if user entered meaningful setup.

Progress indicator: none unless funding initiated.

Empty state: explain no active savings if list contains only drafts.

## Pending Funding

Visible actions: view funding status, cancel if not provider-accepted, review failure.

Disabled actions: renew, withdraw, early withdraw.

Hidden actions: maturity decision.

Required warning: funding not final.

Confirmation: cancel/reversal if prior posting exists.

Progress indicator: funding pending.

## Active

Visible actions: view details, edit renewal policy, preview early withdrawal.

Disabled actions: renew/withdraw all before maturity.

Hidden actions: completed/archive unless historical import.

Required warning: expected/accrued interest is not posted money.

Confirmation: early withdrawal confirmation after preview.

Progress indicator: term/maturity progress behavior allowed.

## Grace Period

Visible actions: renew, withdraw all, review later if allowed.

Disabled actions: normal edit that changes historical terms.

Hidden actions: cancel.

Required warning: decision needed before grace ends.

Confirmation: renewal and withdrawal confirmations required.

Progress indicator: grace remaining.

## Awaiting Renewal

Visible actions: renew, switch if v1, withdraw all.

Disabled actions: early withdrawal preview.

Hidden actions: cancel.

Required warning: matured product requires decision; saved preference does not execute automatically.

Confirmation: renewal/withdrawal.

Progress indicator: decision pending.

## Renewed

Visible actions: view prior decision and new cycle.

Disabled actions: repeat renewal on old cycle.

Hidden actions: old-cycle money actions.

Required warning: none unless provider mismatch.

Confirmation: none.

Progress indicator: transition to Active.

## Completed

Visible actions: view settlement, archive.

Disabled actions: renew, withdraw, early withdraw, edit renewal policy.

Hidden actions: funding.

Required warning: none unless settlement mismatch.

Confirmation: archive if policy requires.

Empty state: completed savings appears historical.

## Closed Early

Visible actions: view withdrawal outcome, archive.

Disabled actions: renew, withdraw, early withdraw.

Hidden actions: funding.

Required warning: show final penalty/forfeiture outcome if applicable.

Confirmation: archive if policy requires.

## Cancelled

Visible actions: view reason, archive.

Disabled actions: funding if cancellation final, renew, withdraw.

Hidden actions: maturity.

Required warning: no active savings exists.

Confirmation: archive if policy requires.

## Archived

Visible actions: view history.

Disabled actions: all money actions.

Hidden actions: funding, renew, withdraw, early withdraw, edit policy.

Required warning: historical only.

