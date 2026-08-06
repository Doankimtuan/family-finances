---
screen_id: health.overview
title: Financial Health
nav_group: health
feature_ids: ["F-Health"]
module: health
phase: MVP
route: /(product)/health
design_foundation: v1.1.0
design_system: v1.0.0
product_definition: v2.0.0
status: OFFICIAL_SCREEN_BLUEPRINT_SOURCE_OF_TRUTH
run_id: run_screen_blueprints_20260801T200000Z
created_at: 2026-08-01T16:20:23Z
frozen: true
---

# Financial Health (`health.overview`)

## Purpose

Score + narrative

## Primary Question

How healthy are we?

## Business Goal

Visible health (REQ-015)

## Primary User

Daily Partner (Daily Partner / Household Steward per Product personas as applicable)

## Entry Points

Home Health chip

## Exit Points

health.insights; home.index

## Navigation

- Nav group: **health**
- Route: `/(product)/health`
- Chrome: BottomNavigation on product groups; Auth/System without five-tab chrome
- Health never a 6th primary tab

## Information Hierarchy

1. HealthCard score
2. Narrative
3. Link insights

## Content Priority

Follow hierarchy order above; one primary question; calm adult voice; glossary terms.

## Primary Actions

View insights

## Secondary Actions

Back Home

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

`HealthCard`, `Text`, `Button`, `TopAppBar`

## Referenced Design Tokens

`--app-viewport-max` 440px · `--color-accent` · `--color-canvas` · spacing `space-4` · Geist · Phosphor · motion 150–250ms

## Referenced Business Rules

BR-01, BR-11

## Referenced Requirements

REQ-015, REQ-011

## Referenced Acceptance Criteria

AC-015, AC-011

## Referenced APIs

API-Insights

## Referenced Domain Modules

`health`

## Referenced Permissions

`member` — Partners equal on daily Money/Plan/Inbox (REQ-020); Admin for elevated policies.

## Analytics Events

`screen_view:health.overview` · `action:primary` on primary CTAs · no PII in payloads

## Future Extension Points

Phase 2 AI assist (BR-14) must not invent balances; Approvals expand Inbox kinds; Wealth Future not linked from IA.
