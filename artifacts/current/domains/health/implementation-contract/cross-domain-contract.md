# Cross-Domain Contract

## Accounts

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Accounts | Health | Accounts provides visible real-money container context; Health interprets visibility only. | Health may show liquidity visibility without changing account truth. |

## Transactions

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Transactions | Health | Transactions provides recent activity and category-linked money movement; Health interprets rhythm and pressure only. | Health may show activity/medical pressure without writing transactions. |

## Cards

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Cards | Health | Cards provides card burden context; Health interprets risk only. | Health may show card pressure without changing card state or repayment. |

## Loans

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Loans | Health | Loans provides loan burden context; Health interprets pressure only. | Health may show loan pressure without changing loan state. |

## Savings

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Savings | Health | Savings provides product/reserve context when visible; Health interprets resilience only. | Health may show resilience context without deposits, withdrawals, renewals, or closure. |

## Planning

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Planning | Health | Planning provides intention and rhythm; Health preserves BR-01. | Health may show planning rhythm without treating it as cash or changing plans. |

## Goals

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Goals | Health | Goals provides target-intention context when visible; Health interprets only. | Health may show goal context without funding, completing, or cancelling goals. |

## Inbox

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Inbox | Health | Inbox provides unresolved decision burden; Health reads pressure only. | Health may show decision pressure without creating or resolving Inbox items. |

## Health

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Health | Other product surfaces | Health provides read-only condition, factors, completeness, and scenarios. | Consumers may display Health context without treating it as source truth. |

## Categories

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Categories | Health | Categories provides classification context; Health reads category evidence only. | Health may show category-based pressure without changing taxonomy. |

## Together

| Producer | Consumer | Shared responsibility | Expected result |
| --- | --- | --- | --- |
| Together | Health | Together provides household, role, and visibility context; Health enforces read permissions. | Health displays only allowed household context and never changes membership. |
