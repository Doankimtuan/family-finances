---
screen_id: inbox.approval-detail
title: Approval Detail
nav_group: inbox
feature_ids: ["F-Approvals"]
module: inbox
phase: Phase2
route: /(product)/inbox/approvals/[id]
design_foundation: v1.1.0
design_system: v1.0.0
product_definition: v2.0.0
status: OFFICIAL_SCREEN_BLUEPRINT_SOURCE_OF_TRUTH
run_id: run_screen_blueprints_20260801T200000Z
created_at: 2026-08-01T16:20:23Z
frozen: true
---

# Approval Detail (`inbox.approval-detail`)

## Purpose

Partner approval moment

## Primary Question

Approve this?

## Business Goal

Phase 2 approvals

## Primary User

Partner (Daily Partner / Household Steward per Product personas as applicable)

## Entry Points

inbox.queue Phase2

## Exit Points

inbox.queue

## Navigation

- Nav group: **inbox**
- Route: `/(product)/inbox/approvals/[id]`
- Chrome: BottomNavigation on product groups; Auth/System without five-tab chrome
- Health never a 6th primary tab

## Information Hierarchy

1. Request
2. Approve/Deny

## Content Priority

Follow hierarchy order above; one primary question; calm adult voice; glossary terms.

## Primary Actions

Approve

## Secondary Actions

Deny

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

If offline: block money/plan mutations; show system.offline or inline fail-closed (BR-15 / REQ-018 / AC-018). Never queue local writes.

## Accessibility

Keyboard where capture/Inbox/ritual; focus visible; touch ≥44px; status not color-alone; REQ-019 when on critical paths.

## Responsive Rules

Mobile Native source of truth; breakpoints only for spacing/centering.

## Desktop Rendering Rules

Centered AppViewport max 440px; same mobile layout; no sidebar; no multi-column dashboard; overlays confined to viewport (Design Foundation v1.1.0).

## Required Components

`ReviewCard`, `Button`, `Dialog`

## Referenced Design Tokens

`--app-viewport-max` 440px · `--color-accent` · `--color-canvas` · spacing `space-4` · Geist · Phosphor · motion 150–250ms

## Referenced Business Rules

BR-13, BR-14

## Referenced Requirements

REQ-013, REQ-017

## Referenced Acceptance Criteria

AC-013, AC-017

## Referenced APIs

API-Settings

## Referenced Domain Modules

`inbox`

## Referenced Permissions

`member` — Partners equal on daily Money/Plan/Inbox (REQ-020); Admin for elevated policies.

## Analytics Events

`screen_view:inbox.approval-detail` · `action:primary` on primary CTAs · no PII in payloads

## Future Extension Points

Phase 2 AI assist (BR-14) must not invent balances; Approvals expand Inbox kinds; Wealth Future not linked from IA.
