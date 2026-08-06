# Executive Summary

## Decision

ViNha should evolve into a calm mobile-first financial companion with a soft consumer-app surface, strong financial meaning, and restrained expressive detail.

The current stack already supports this direction:

- HeroUI wrappers in `shared/ui`
- Product patterns in `shared/patterns`
- Geist typography
- Phosphor icons
- Motion for purposeful micro-interactions
- Recharts for minimal charts
- Semantic light and dark tokens in `styles/globals.css`
- A 440px app viewport contract in `AppViewport`

## What Changes

Phase D changes how screens should look, feel, and be implemented. It does not change what screens exist or how flows behave.

The visual system should reduce card soup, improve amount hierarchy, standardize financial meaning labels, make empty and partial states more supportive, and make mobile actions feel native and reachable.

## Canonical Design Dials

- Design variance: 4 of 10
- Motion intensity: 3 of 10
- Visual density: 5 of 10

These values intentionally override generic taste-skill defaults. ViNha is a product application for daily household money work, not a landing page or experimental showcase.

## Conditions For Readiness

The design system is ready with implementation conditions:

- Existing shared components need to be audited and promoted into the taxonomy.
- Missing financial patterns should be added through Rule of Three unless they are platform primitives.
- Every changed screen needs 440px browser evidence, dark-mode evidence, localization evidence, and accessibility checks.

