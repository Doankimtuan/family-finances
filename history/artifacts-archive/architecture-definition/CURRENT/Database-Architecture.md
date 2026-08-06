---
document: Database Architecture
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Database Architecture

## Platform

PostgreSQL on Supabase with RLS.

## Schema ownership (logical)

| Schema/area | Owner module |
|-------------|--------------|
| households, members, invitations | tenancy |
| accounts, transactions, liabilities, savings_*, installments | ledger |
| jars, jar_*, goals, recurring_* , month_close_* | plan |
| review_queue → inbox_items (strangler view/table) | inbox |
| health_snapshots, insights | health |
| outbox | platform |

## Database Design principles

- Expand/contract migrations  
- Household_id on all tenant rows  
- RLS using `is_household_member`  
- Soft states: Active/Paused/Archived for jars per Product BR  

## Mapping Month Ritual

Product "Month Ritual" ↔ existing close-run tables via plan module naming — no reckless rename mid-flight.
