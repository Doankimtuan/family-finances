# Feature gap — legacy vs current Accounts

| Capability | Legacy | Current (pre-MVP) | Gap disposition |
|------------|--------|-------------------|-----------------|
| List liquid accounts | Yes | Yes | Keep; enrich UX |
| Real / net position | Net worth hero | Real Position (BR-01) | Keep Product framing |
| Create account | Dialog + types + opening | Inline form; opening forced 0 | **MVP:** progressive create + opening balance |
| Edit name/type | Missing | Missing | **MVP:** `updateAccount` |
| Archive | Yes | Schema only | **MVP:** `archiveAccount` + confirm |
| Restore / hard delete | No / soft column | No | Roadmap / out |
| Opening balance | Yes | Schema + Zod; UI 0 | **MVP:** create-time field |
| Transfers | Activity transfer | Income/expense only | Roadmap |
| Credit card account type | Yes | No (by Product) | Proposal only (D-01) |
| Billing cycles / statements | Yes | No | Proposal only |
| FIFO settle / cashback | Yes | No | Proposal only |
| Installments / EMI | On CC | `/money/cards` product | Keep Product model |
| Debts / liabilities | On Money hub | `/money/debts` | Keep |
| Term savings | On Money hub | `/money/savings` | Keep |
| Account health / utilization | CC usage bar | None | **MVP:** liquid health chips only |
| Quick actions on detail | Settle / cashback / EMI | Balance + recent only | **MVP:** capture, activity, edit, archive |
| Cash vs credit IA | Mixed hub sections | Hub “more” links only | **MVP:** plans strip on Accounts |
| Tests | Legacy none modern | Unit create + e2e hub | **MVP:** extend unit/e2e |
| i18n | Hardcoded VI strings | next-intl money.* | Keep / extend |
