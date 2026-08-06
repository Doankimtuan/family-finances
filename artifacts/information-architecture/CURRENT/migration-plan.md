# Migration Plan

Architecture-only migration plan. No implementation steps are prescribed beyond sequencing.

## Phase B to Phase C Handoff

1. Treat the five-tab model as fixed.
2. Treat Health and Settings as secondary surfaces.
3. Use the screen catalog as the canonical UX redesign input.
4. Use route taxonomy when creating UX flows.
5. Use component ownership rules before creating any design system components.

## IA Migration Sequence

### Step 1 - Canonical Route Map

Outcome:

- Document canonical route constants for all Phase B routes.
- Mark compatibility routes as redirect-only.

Affected audit issues:

- Route taxonomy implicit.
- `/money/add` duplicate capture entry.
- `/money/cards` compatibility route.

### Step 2 - Secondary Navigation Model

Outcome:

- Define Money secondary navigation.
- Define Plan secondary navigation.
- Define Together secondary navigation.
- Define Health entry points.

Affected audit issues:

- Money depth.
- Plan subarea grouping.
- Health discovery.

### Step 3 - Screen Ownership Registry

Outcome:

- Every screen has one owner.
- Owner modules claim route, form, dialogs, and local UI.

Affected audit issues:

- Mixed responsibilities.
- Broad app route coupling.
- Component ownership ambiguity.

### Step 4 - Action Flow Normalization

Outcome:

- Object actions become children of object detail.
- Create routes use `/new`.
- Action route names are consistent.

Affected audit issues:

- No shared action-page pattern.
- Mixed edit/refund/correct/pay/close route hierarchy.

### Step 5 - Component Tiering

Outcome:

- `shared/ui` remains primitive.
- `shared/patterns` splits into shell/state/overlay/display.
- Module entity cards move to module-owned UI in later phases.

Affected audit issues:

- `shared/patterns` catch-all.
- Product-specific shared cards.
- Empty `components/` ambiguity.

### Step 6 - Large Screen Decomposition Plan

Outcome:

- Identify screen components that need architectural decomposition before UX/design-system work.
- Decompose by screen responsibility, not business behavior.

Affected audit issues:

- Large route-colocated UI files.
- Forms combining layout/state/mutation.

## Compatibility Policy

- Compatibility routes may remain during redevelopment for old links.
- Compatibility routes are not user-facing entry points.
- Compatibility route usage should be measured and gradually retired.
- No Phase C/F blueprint should reference compatibility routes.

## Non-Goals

- No business rule changes.
- No domain model changes.
- No financial invariant changes.
- No UI layout or visual redesign.
- No implementation.

