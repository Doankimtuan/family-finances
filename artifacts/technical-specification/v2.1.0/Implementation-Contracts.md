---
document: Implementation Contracts
technical_specification: v2.1.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Implementation Contracts

## REQ → Implementation map

| REQ | Module | Primary command/query |
|-----|--------|------------------------|
| `REQ-001` | via feature `F-Home` / API `API-Dashboard` | See module specs; task `TASK-Home` |
| `REQ-002` | via feature `F-Auth` / API `API-Session` | See module specs; task `TASK-Auth` |
| `REQ-002a` | via feature `F-Auth` / API `API-Session` | StartOAuthSignIn, SignInWithPassword, LinkIdentity, SignOut, DeleteAccount; task `TASK-Auth` |
| `REQ-003` | via feature `F-Plan` / API `API-Jars` | See module specs; task `TASK-Plan` |
| `REQ-004` | via feature `F-Plan` / API `API-Jars` | See module specs; task `TASK-Plan` |
| `REQ-005` | via feature `F-Inbox` / API `API-Jars-Review` | See module specs; task `TASK-Inbox` |
| `REQ-006` | via feature `F-Plan` / API `API-Jars` | See module specs; task `TASK-Plan` |
| `REQ-007` | via feature `F-Together` / API `API-Household` | See module specs; task `TASK-Together` |
| `REQ-008` | via feature `F-Plan` / API `API-MonthClose` | See module specs; task `TASK-Ritual` |
| `REQ-009` | via feature `F-Plan` / API `API-MonthClose` | See module specs; task `TASK-Ritual` |
| `REQ-010` | via feature `F-Money` / API `API-Savings` | See module specs; task `TASK-Savings` |
| `REQ-011` | via feature `F-Money` / API `API-Accounts-Card` | See module specs; task `TASK-Cards` |
| `REQ-012` | via feature `F-Together` / API `API-Household` | See module specs; task `TASK-Together` |
| `REQ-013` | via feature `F-Together` / API `API-Settings` | See module specs; task `TASK-Together` |
| `REQ-014` | via feature `F-Onboard` / API `API-Household` | See module specs; task `TASK-Onboard` |
| `REQ-015` | via feature `F-Health` / API `API-Insights` | See module specs; task `TASK-Health` |
| `REQ-016` | via feature `F-Money` / API `API-Categories` | See module specs; task `TASK-Money` |
| `REQ-017` | via feature `F-AI-Assist` / API `API-Insights` | See module specs; task `TASK-AI` |
| `REQ-018` | via feature `F-Money` / API `API-All-Mutating` | See module specs; task `TASK-Platform` |
| `REQ-019` | via feature `F-Home` / API `API-N/A-UI` | See module specs; task `TASK-A11y` |
| `REQ-020` | via feature `F-Together` / API `API-Settings` | See module specs; task `TASK-Together` |

## Module → API

Home summary, inbox, accounts, transactions, jars, month-ritual, health — as API-Contracts.

## DB entity → Module

See database Table Specifications ownership.
