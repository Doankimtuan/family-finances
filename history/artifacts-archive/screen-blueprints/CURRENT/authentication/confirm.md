---
screen_id: auth.confirm
title: Auth Confirm
nav_group: authentication
feature_ids: ["F-Auth"]
module: tenancy
phase: MVP
route: /auth/confirm
design_foundation: v1.1.0
design_system: v1.0.0
product_definition: v2.1.0
status: OFFICIAL_SCREEN_BLUEPRINT_SOURCE_OF_TRUTH
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
frozen: true
---

# Auth Confirm (`auth.confirm`)

## Purpose

Confirm email/magic link and surface OAuth PKCE exchange errors (success usually redirects away)

## Primary Question

Is link valid?

## Business Goal

Activate session

## Primary User

Any (Daily Partner / Household Steward per Product personas as applicable)

## Entry Points

Email deep link; OAuth redirect with `code`

## Exit Points

onboard.wizard; home.index; auth.login

## Navigation

- Nav group: **authentication**
- Route: `/auth/confirm`
- Chrome: BottomNavigation on product groups; Auth/System without five-tab chrome
- Health never a 6th primary tab

## Information Hierarchy

1. Status
2. Continue

## Content Priority

Follow hierarchy order above; one primary question; calm adult voice; glossary terms.

## Primary Actions

Continue

## Secondary Actions

—

## Interaction Flow

1. Enter via Entry Points  
2. Scan hierarchy top → bottom  
3. Take primary action or navigate Exit Points  
4. Return via back / bottom nav as appropriate  

## Success Flow

Action completes → confirmation Toast or next screen → data reflects Real Ledger vs Intention correctly (BR-01).

## Error Flow

Human-readable error from API envelope → inline Alert or Dialog → retry or correction path (never silent money failure).

## Validation Flow

RHF + Zod on forms; positive magnitudes + explicit direction (BR-06) where money entry applies.

## Confirmation Flow

Destructive money / ritual approve / policy save → Dialog preview + confirm.

## Loading Behavior

Block primary chrome with section Skeleton or Spinner; do not blank entire app unnecessarily.

## Skeleton Behavior

Skeleton shapes match final zones (Design System `Skeleton` / `LoadingState`).

## Empty State

`EmptyState` with next action when lists/queues empty (Home day-0 trio when applicable).

## Offline Behavior

Read may continue; mutations N/A or blocked if attempted.

## Accessibility

Keyboard where capture/Inbox/ritual; focus visible; touch ≥44px; status not color-alone; REQ-019 when on critical paths.

## Responsive Rules

Mobile Native source of truth; breakpoints only for spacing/centering.

## Desktop Rendering Rules

Centered AppViewport max 440px; same mobile layout; no sidebar; no multi-column dashboard; overlays confined to viewport (Design Foundation v1.1.0).

## Required Components

`Spinner`, `Alert`, `Button`

## Referenced Design Tokens

`--app-viewport-max` 440px · `--color-accent` · `--color-canvas` · spacing `space-4` · Geist · Phosphor · motion 150–250ms

## Referenced Business Rules

BR-02, BR-02b

## Referenced Requirements

REQ-002, REQ-002a

## Referenced Acceptance Criteria

AC-002, AC-002a, AC-002b

## Referenced APIs

API-Session

## Referenced Domain Modules

`tenancy`

## Referenced Permissions

`public` — Partners equal on daily Money/Plan/Inbox (REQ-020); Admin for elevated policies.

## Analytics Events

`screen_view:auth.confirm` · `action:primary` on primary CTAs · no PII in payloads

## Future Extension Points

Phase 2 AI assist (BR-14) must not invent balances; Approvals expand Inbox kinds; Wealth Future not linked from IA.
