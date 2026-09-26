---
version: alpha
name: ViNha Icon System Exploration
description: A complete, coherent icon design language for a bilingual family finance product. This file is a design brief, not an implementation change.
colors:
  canvas-light: "#FAFAF9"
  surface-light: "#FFFFFF"
  text-light: "#18181B"
  muted-light: "#52525B"
  border-light: "#DDE4E1"
  primary-light: "#0F766E"
  primary-soft-light: "#E7F5F1"
  income-light: "#047857"
  expense-light: "#27272A"
  transfer-light: "#0369A1"
  investment-light: "#7C3AED"
  debt-light: "#BE123C"
  warning-light: "#B45309"
  canvas-dark: "#141416"
  surface-dark: "#1C1C1F"
  text-dark: "#F4F4F5"
  muted-dark: "#A1A1AA"
  border-dark: "#3F3F46"
  primary-dark: "#2DD4BF"
  primary-soft-dark: "#173B37"
  income-dark: "#34D399"
  expense-dark: "#E4E4E7"
  transfer-dark: "#38BDF8"
  investment-dark: "#A78BFA"
  debt-dark: "#FB7185"
  warning-dark: "#FBBF24"
typography:
  page-title:
    fontFamily: Geist Sans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Geist Sans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
rounded:
  control: 10px
  card: 12px
  overlay: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  page-gutter: 16px
  app-width: 440px
components:
  icon-micro:
    size: 14px
  icon-small:
    size: 16px
  icon-default:
    size: 20px
  icon-navigation:
    size: 24px
  icon-feature:
    size: 32px
  icon-display:
    size: 40px
  icon-container-small:
    size: 32px
    rounded: "{rounded.control}"
  icon-container-default:
    size: 40px
    rounded: "{rounded.control}"
  icon-button:
    size: 44px
    rounded: "{rounded.control}"
---

# ViNha Icon System

## Overview

ViNha helps young Vietnamese households understand real money, plan shared intentions, and make financial decisions together. It should feel calm, warm, optimistic, trustworthy, and slightly expressive. Financial amounts and written labels lead the interface. Icons make destinations, actions, and categories easier to recognize; they must never become the main visual event.

This document commissions **one original, complete icon family**. Do not imitate, name, or compare another app or icon library. Design the artwork for ViNha's product meaning and existing visual proportions. The set is for English and Vietnamese interfaces; symbols must not depend on Latin letters, currency signs, or culturally narrow visual jokes. The app logo and third-party sign-in marks are outside this icon family.

### Icon art direction: warm precision

- One 24×24 master SVG viewBox for every icon; use a consistent optical center and roughly 2px of breathing room, adjusted optically rather than mechanically.
- Primarily open, rounded strokes with restrained geometry. Use rounded caps and joins, gentle corners, and enough negative space to remain legible at 16px.
- Default stroke: approximately 1.5px at 24px. Emphasized state: approximately 1.9px. Treat these as a starting optical target; tune a single family-wide rule if the contact sheets show weakness.
- Mostly symmetric or stable silhouettes, with small asymmetry only when it clarifies an action or financial direction. No perspective, 3D depth, gradients, textures, shadows inside glyphs, or decorative flourishes.
- One-color glyphs using the surrounding semantic color. Small solid dots or short filled areas are allowed only when essential to distinguish concepts; they must follow the same grammar across the set.
- At 16px, remove internal detail before changing the family style. A reduced-detail micro version may exist for complex concepts, but it must read as the same icon.
- Category and tag icons must be as disciplined as navigation and utility icons. Do not let later batches become more illustrative, playful, or dense.

The five primary destinations are **Home, Money, Plan, Inbox, Together**. Money means real balances and transactions. Plan means intentions such as jars and goals; a jar is not cash in an account. Inbox is a decision queue. Together means household membership and shared finances. Their silhouettes must remain distinct when viewed together at 24px.

## Colors

The YAML tokens above reproduce the product's light and dark reference palette. Use them to show icons in realistic context; the icon artwork itself is monochrome and inherits the semantic foreground color. A category's color may aid scanning but cannot be its only identifier. Preserve the distinct roles of income, expense, transfer, investment, debt, and warning. Serious warnings must remain restrained and clear.

Show light and dark examples for every component pattern. Never bake a light-only or dark-only color into an SVG. Keep body text and control contrast at WCAG AA. Use color plus icon plus label or context for financial and status meaning.

## Typography

Use Geist Sans for the contact-sheet UI, labels, and examples. Money uses tabular numerals. Keep icon labels short, sentence case, and translatable. Every navigation icon has a visible label. Do not add letters or words inside icons to distinguish them; those would fail localization and small-size tests.

## Layout

The app remains a centered, single-column 440px canvas at mobile and desktop widths, with 16px page gutters and a 4px spacing rhythm. The bottom navigation has five equal-width destinations, 24px icons over visible labels, and a minimum 56px tab target. A separate Add Transaction pill sits above the navigation; it is not a center tab. Row icons usually fit in 32px or 40px tonal containers. Empty-state and error icons may reach 40px.

Generate the icon atlas as **numbered contact sheets of at most 24 icons each**. Every sheet must reuse the same master grid, stroke, corner behavior, label style, spacing, and light/dark examples. Show each icon at 24px and a 16px reduction; show the five navigation icons together at their real 24px size. Do not replace any icon with an emoji or stock illustration.

## Elevation & Depth

Use borders, spacing, and soft tonal surfaces to establish hierarchy. Do not add depth to the SVG artwork. A glyph in a tonal container should feel quieter than a financial amount. Shadows belong to truly floating UI surfaces, not to icons.

## Shapes

Controls and icon containers use 10px corners; cards use 12px; overlays use 16px. Circles are reserved for people/avatar or unmistakable status marks. The icon family should echo this soft but disciplined shape language without turning every object into a rounded blob. Avoid pill-shaped icon backgrounds as a default.

## Components

### Required states and use cases

- **Bottom navigation:** five distinct icons; inactive uses muted stroke, active uses primary stroke plus soft selected surface and stronger label. Do not rely on color alone. Keep the same icon geometry between states; an optional subtle stroke-weight change is acceptable.
- **Icon button:** 44×44px minimum target, visible focus, accessible name, disabled treatment. Show search, filter, back, close, more, edit, delete, visibility, calendar, and add at 16–20px.
- **Category row:** 16–20px icon in a 32px tonal container, text label, and amount. Recognition must survive without the tone.
- **Financial object row:** 20px icon in a 40px container beside a label and right-aligned value. Distinguish cash, account, card debt, savings, investment estimate, and Plan jar.
- **Status message:** icon beside explicit status text. Show information, success, caution, critical, pending, and empty states in both themes.
- **Hero or empty state:** 32–40px icon with no extra detail that would disappear in a row-size version.
- **Forms and overlays:** date, time, select, search, validation, dismiss, and disclosure icons follow the same micro-icon language.

### Full semantic icon inventory

Every name below is required as a designed icon or an explicitly documented semantic alias to the **same** drawing. Do not silently omit names. Keep names stable even if artwork changes. The existing persisted category and transaction-tag keys are marked **[stored]** and must remain separate semantic entries.

**A. Primary navigation (5):** home, money, plan, inbox, together.

**B. Financial fundamentals (25):** account, bank, wallet, cash, banknote, coins, credit-card, debit-card, income, expense, transfer, refund, payment, deposit, withdrawal, transaction, transaction-history, balance, available-money, pending-money, shared-money, personal-money, currency-exchange, receipt, bill.

**C. Savings and providers (17):** savings, savings-account, savings-goal, interest, maturity, renewal, vault, safe, piggy-bank, provider-bank, provider-building, provider-wallet, provider-phone, provider-shield, provider-coins, provider-chart, provider-finance.

**D. Investments (15):** investment, stock, fund, bond, gold, crypto, market-value, price-change, profit, loss, dividend, buy, sell, valuation, price-stale.

**E. Credit, loans, and debt (18):** loan, bank-loan, personal-loan, family-loan, friend-loan, store-financing, buy-now-pay-later, tuition-loan, medical-loan, vehicle-loan, home-loan, debt, repayment, installment, credit-limit, due-date, overdue, paid-off.

**F. Planning (18):** jar, budget, goal, target, allocation, recurring-payment, scheduled-transaction, calendar, month, review, recommendation, forecast, progress, milestone, completed-goal, ritual, period, plan-movement.

**G. Household and people (17):** family, household, member, couple, child, invite, invitation-accepted, shared-access, owner, permission, privacy, notification, reminder, partner, former-member, household-policy, household-settings.

**H. Spending and income categories (64):** coffee, food **[stored]**, restaurant, groceries, dining-out, snacks, shopping **[stored]**, clothing, beauty, gift, celebration, travel **[stored]**, flight, hotel, transport **[stored]**, fuel, parking, public-transit, taxi, vehicle, home **[stored]**, rent, mortgage, utilities, electricity, water, internet, phone, household-supplies, repairs, furniture, health **[stored]**, medicine, fitness, education **[stored]**, books, childcare, pets, entertainment, streaming, gaming, family **[stored]**, charity, insurance, taxes, fees, salary **[stored]**, freelance, business-income, bonus, investment-income, subscription, wedding, funeral, religious-giving, personal-care, electronics, office, childcare-school, vacation, hobby, refund-category, bank-fee, other **[stored]**.

**I. Transaction tags (14 stored keys):** briefcase **[stored]**, bookmark **[stored]**, education **[stored]**, family **[stored]**, food **[stored]**, gift **[stored]**, health **[stored]**, home **[stored]**, shopping **[stored]**, star **[stored]**, subscription **[stored]**, transport **[stored]**, travel **[stored]**, work **[stored]**. Tags may reuse a category drawing when meaning and visual scale match; the alias must be listed.

**J. Additional tag concepts (11):** personal, essential, optional, one-time, recurring, reimbursable, shared, urgent, favorite, custom-tag, uncategorized.

**K. Actions and micro-icons (48):** add, minus, edit, delete, archive, restore, save, cancel, close, confirm, check, search, filter, sort, more, menu, settings, back, forward, chevron-left, chevron-right, chevron-up, chevron-down, arrow-up, arrow-down, arrow-left, arrow-right, expand, collapse, refresh, retry, copy, share, download, upload, external-link, open, calendar-picker, time-picker, visibility-on, visibility-off, clear, select, drag-handle, lock, unlock, link, unlink.

**L. Feedback and system states (19):** information, help, success, warning, error, blocked, pending, loading, empty-state, offline, secure, attention, unread, read, check-circle, alert-circle, prohibited, muted, history.

The inventory contains **271 named semantic entries** before aliasing. A repeated word in different groups is an intentional cross-context requirement, not an instruction to invent duplicate artwork. Provide one index keyed by group and name, showing either the unique icon or the exact alias target. Do not invent database keys from the extended vocabulary; these are design concepts until separately approved for implementation.

### Meaning and recognition tests

Test these pairs side by side, with labels hidden for one pass: account versus loan; wallet versus jar; cash versus investment value; income versus refund; expense versus repayment; transfer versus transaction; warning versus overdue; food versus coffee; family category versus household navigation; calendar versus due date. Revise any pair that is visually confusable at 16 or 24px. Use familiar real-world objects where they help, but simplify them to the family grammar.

### Deliverables

1. A master icon specification with grid, stroke, caps, joins, optical padding, allowed fills, active-state rule, and small-size simplification rule.
2. A complete index of all 271 named entries, including explicit aliases and a count of unique drawings.
3. Numbered contact sheets of at most 24 unique drawings each, generated until the index is covered. Keep an identical style across every sheet.
4. Light/dark examples in the real navigation, row, button, form, status, and 32/40px container contexts.
5. SVG-ready artwork with consistent 24×24 viewBox, semantic `currentColor` behavior, and no embedded color for ordinary icons.
6. A final 16px legibility and semantic-confusion review with revisions, plus a coverage checklist for every inventory name.

If one generation cannot produce the entire atlas, continue in ordered batches while retaining this document as the master source of truth. Do not compress the request to a small sample and call it complete.

## Do's and Don'ts

- Do prioritize trust, clarity, and household warmth over novelty.
- Do use one visual family for navigation, categories, tags, actions, forms, and status.
- Do preserve the difference between real balance, planned allocation, estimated investment value, and debt.
- Do pair important icons with visible or accessible words. Decorative SVGs should be hidden from assistive technology; icon-only controls need accessible names.
- Do verify at 16, 20, and 24px, in light and dark themes, and with English/Vietnamese labels.
- Don't redesign the app, change its routes, alter business meaning, or turn this file into an implementation plan.
- Don't use emoji, 3D, gradients, skeuomorphism, tiny internal detail, multicolor category glyphs, or a second visual family for micro-icons.
- Don't treat an icon contact sheet as finished until every required name appears in the index and every unique drawing appears on a sheet.
