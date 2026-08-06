# Flow Catalog

Compact flow contracts. Domain behavior is referenced from canonical contracts, not copied.

## Common Contract

For every flow:

- Loading: show skeleton or progress state without implying success.
- Error: preserve previous valid state and explain next recovery action.
- Offline: allow read-only review; block unsafe mutation with recovery.
- Cancel: return to origin without changing facts.
- Success: show receipt and return to owner detail, parent list, or origin context.

## Onboarding and Household

| Journey | Goal | Entry | Preconditions | Main path | Alternatives | Exit | Primary action | Info required/shown | Confirmation | Related transitions |
|---|---|---|---|---|---|---|---|---|---|---|
| Register | Create user account. | Welcome/Register | Not signed in | Enter identity/auth fields -> submit -> confirm or create household | OAuth sign-up, existing email -> login | Onboard/Home | Create account | Email/name/password or provider; terms consent | None beyond submit | Auth -> Onboard |
| Login | Resume household access. | Welcome/Login | Existing account | Enter credentials -> submit -> resolve membership | OAuth, forgot password, no household | Home/Onboard | Sign in | Credential/provider; error reason | None | Auth -> Home |
| OAuth callback | Complete provider auth. | Provider redirect | OAuth started | Validate callback -> resolve session -> route | Link error -> explanatory recovery | Home/Onboard/Login | Continue | Provider status, account identity | None | Auth -> Home/Onboard |
| Create household | Establish household. | Onboard | Signed in, no membership | Name household -> starter plan choice -> confirm | Skip advanced policies | Home | Create household | Household name, basic preference | Lightweight | Onboard -> Home |
| Join household | Join existing household. | Invite/Onboard | Valid invite or membership path | Review household -> accept -> join | Need login/register; expired invite | Home/Together | Join household | Household name, inviter, role | Lightweight | Invite -> Together/Home |
| Invite partner | Add member. | Together/Invitations | Permission | Enter contact -> review role -> send | Cancel, duplicate invite | Invitations | Send invite | Contact, role, expiry if shown | Lightweight | Together -> Invite |
| Accept invitation | Join invited household. | Invite link | Valid token | Review invite -> authenticate if needed -> accept | Expired/revoked/wrong user | Home/Together | Accept invite | Household, inviter, role | Lightweight | Invite -> Home |
| Switch/leave household | Change membership context. | Together Settings | Multiple household or member | Select household or review leave impact -> confirm | Ownership transfer required | Home/Auth | Switch/Leave | Current household, effect on access | Preview-confirm for leave | Together -> Home/Auth |
| Profile/preferences | Maintain household/user preferences. | Together Preferences | Membership | Edit safe preferences -> save | Permission denied | Together | Save | Preference values | No/lightweight | Together |

## Daily Money and Accounts

| Journey | Goal | Entry | Preconditions | Main path | Alternatives | Exit | Primary action | Info required/shown | Confirmation | Related transitions |
|---|---|---|---|---|---|---|---|---|---|---|
| View real position | Understand available reality. | Home/Money | Membership | Open Money -> scan accounts, recent movement, next action | Empty -> add account | Money | Add/capture if needed | Balances, recent movements, freshness | None | Money -> Accounts/Tx |
| Create income | Record received money. | Home/Money/Transactions | Account exists | Amount -> destination account -> category/source -> preview -> save | Missing category -> Inbox/uncategorized | Transaction detail | Save income | Amount, account, date, source/category | Preview-confirm if consequential/closed period | Money/Plan |
| Create expense | Record spent money. | Home/Money/Transactions | Account exists | Amount -> source account -> category/jar context -> preview -> save | Overspend/emergency path, unresolved category -> Inbox | Transaction detail | Save expense | Amount, account, merchant/category/date | Preview-confirm when warning/closed period | Money/Plan/Inbox |
| Transfer | Move between accounts. | Money/Transactions | Two accounts | Amount -> from -> to -> date -> preview -> save | Same account validation | Transaction detail | Save transfer | Source, destination, amount, date | Preview-confirm | Accounts/Tx |
| Search transactions | Find movement. | Transactions | Transactions exist | Search/filter -> select result | Empty/no results recovery | Transaction detail | Search/select | Query, filters, result count | None | Tx detail |
| Review transaction detail | Understand one movement. | Transaction row/deep link | Transaction exists | Open detail -> see amount, account, category, audit/actions | Missing/deleted -> recovery | Parent list/origin | Correct/refund if needed | Posted facts, related records | None | Account/Inbox |
| Refund transaction | Reverse/record refund. | Transaction detail/Inbox | Refund eligible | Enter amount/date/destination -> preview -> confirm | Partial refund, invalid amount | Transaction detail/origin | Confirm refund | Original, refund, account, related records | Preview-confirm | Inbox/Money |
| Correct transaction | Correct facts safely. | Transaction detail/Inbox | Correction allowed | Choose correction reason -> edit fields -> preview audit effect -> confirm | Closed period warning | Transaction detail/origin | Confirm correction | Before/after, reason, audit chain | Preview-confirm | Inbox/Money |
| Create account | Add money container. | Money/Accounts | Membership | Type -> name -> opening balance -> review -> save | Credit/card path | Account detail | Save account | Account name/type/opening balance/date | Preview-confirm if opening balance posts | Money |
| Edit/archive account | Maintain account. | Account detail | Account exists | Edit safe fields or review archive dependencies -> confirm | Has dependencies -> explain blockers | Account detail/list | Save/archive | Account, dependencies, effect | Archive preview-confirm | Money |
| Recent activity | Review account activity. | Account detail | Account exists | Scroll activity -> open transaction | Empty activity | Transaction detail | Open item | Activity, filters | None | Transaction detail |

## Cards, Loans, Savings, Investments

| Journey | Goal | Entry | Preconditions | Main path | Alternatives | Exit | Primary action | Info required/shown | Confirmation | Related transitions |
|---|---|---|---|---|---|---|---|---|---|---|
| Create card | Track credit card line. | Money Products/Cards | Permission | Card identity -> limit/billing dates -> opening state -> save | Missing billing facts -> review later | Card detail | Save card | Card name, issuer, limit, statement/due date | Lightweight/preview if balance posts | Money |
| Card status/statement | Know owed amount and due date. | Card detail | Card exists | Open detail -> review cycle, due, installments | Missing cycle -> add details | Card detail | Pay/review | Statement, due date, unpaid amount | None | Transactions |
| Record card payment | Record repayment. | Card detail | Due/payment eligible | Amount -> source account -> preview -> confirm | Partial/full | Card detail | Confirm payment | Source, amount, cycle, date | Preview-confirm | Transactions |
| Review installment | Understand obligation. | Card/Loan detail | Installment exists | Open item -> see remaining schedule/status | N/A | Detail | Pay/review | Schedule, due, paid/remaining | None | Money |
| Create loan | Track obligation. | Loans | Permission | Lender -> amount -> method -> schedule preview -> save | Compare methods, missing terms | Loan detail | Save loan | Lender, principal, rate/method, due date | Preview-confirm if money movement posts | Money |
| Loan payment/early payoff | Record repayment. | Loan detail | Loan active | Amount/mode -> source -> preview schedule/progress -> confirm | Early payoff, partial payment | Loan detail | Confirm payment | Source, amount, interest/principal effect, date | Preview-confirm | Transactions |
| Update future interest | Change future schedule. | Loan detail | Allowed state | New rate/effective date -> preview schedule delta -> confirm | Invalid date | Loan detail | Save future rate | Rate, date, schedule impact | Lightweight/preview | Loan |
| Complete/archive loan | End obligation/history. | Loan detail | Eligible | Review remaining state -> confirm close/archive | Outstanding blocker | Loans/list | Close/archive | Remaining amount, historical access | Preview-confirm | Money |
| Create savings contract | Track savings product. | Savings | Account exists | Provider/name -> principal/funding -> term/maturity -> preview -> confirm | Draft if missing optional facts | Saving detail | Confirm creation | Source, principal, term, expected interest, maturity | Preview-confirm | Money/Inbox |
| Savings maturity | Resolve maturity decision. | Inbox/Saving detail | Matured ReviewItem | Review options -> renew/withdraw/change package -> preview -> confirm | Needs partner/unclear facts | Saving detail/Inbox | Confirm decision | Principal, interest, destination, renewal terms | Preview-confirm | Inbox/Money |
| Early withdrawal | Understand penalty before action. | Saving detail | Eligible active saving | Preview penalty/proceeds -> choose destination -> confirm | Cancel after preview | Saving detail | Confirm withdraw | Penalty, proceeds, destination, date | Preview-confirm | Transactions |
| Create investment holding | Track risk-bearing asset. | Money Products/Investments | Investment surface enabled | Holding identity -> contribution -> value/date/source -> risk/liquidity context -> save | Under review if facts incomplete | Investment detail | Save holding | Name, asset class, contribution, estimated value/date/source | Lightweight; preview if linked cash movement | Money |
| Record buy | Add exposure context. | Investment detail/Transactions | Account exists | Record real cash transaction -> attach investment context -> confirm | Manual recognition without cash link | Investment detail | Confirm buy | Source account, amount, holding, date | Preview-confirm | Transactions |
| Record sell | Exit/partial exit. | Investment detail | Active holding | Proceeds/destination -> remaining exposure -> realized outcome preview -> confirm | Unknown proceeds -> Under Review | Investment detail | Confirm sell/exit | Proceeds, destination, realized/unrealized distinction | Preview-confirm | Transactions/Inbox |
| Dividend/income | Record investment income. | Investment detail/Transactions | Holding exists | Amount -> destination account -> context -> preview -> save | Non-cash distribution -> context only | Transaction detail | Save income | Issuer/provider, amount, account, date | Preview-confirm if money moved | Transactions |
| Update valuation | Refresh estimated value. | Investment detail | Holding can be valued | Value -> date -> source/confidence -> save | Unknown source -> warn/stale label | Investment detail | Save valuation | Estimated value, date, source | Lightweight | Health read-only |
| Performance review | Understand realized/unrealized result. | Investment detail/Health | Holding exists | Read contribution, estimated value, realized outcome, freshness | Stale/uncertain -> Inbox review | Source/origin | Review facts | Realized/unrealized, value source/date, liquidity | None | Health/Inbox |

## Plan, Goals, Inbox, Together, Health

| Journey | Goal | Entry | Preconditions | Main path | Alternatives | Exit | Primary action | Info required/shown | Confirmation | Related transitions |
|---|---|---|---|---|---|---|---|---|---|---|
| Manage jars | Shape monthly intention. | Plan/Jars | Membership | View jars -> create/edit/reallocate -> preview plan effect -> save | Emergency/overspend warning | Jar detail | Save/reallocate | Capacity, source/destination jar, date | Preview for reallocation | Plan |
| Month Ritual | Close reflection. | Plan/Ritual | Eligible month | Review divergence -> resolve decisions -> approve/lock | Assisted/Quick Close when eligible | Plan/Home | Complete ritual | Summary, unresolved items, lock effect | Preview-confirm | Inbox/Plan |
| Create/manage goal | Track intention milestone. | Plan/Goals | Membership | Goal details -> funding behavior context -> save -> progress review | Pause/archive/complete | Goal detail | Save/complete | Target, timeline, approved funding context | Lightweight; preview for archive/complete | Plan/Money |
| Inbox review | Resolve typed item. | Inbox/Home/context | ReviewItem exists | Open queue -> detail -> one decision -> confirm if needed | Delegate/batch if eligible, stale recovery | Inbox/object detail | Resolve | Decision question, source facts, consequence | By consequence | Owner module |
| Together shared action | Manage household change. | Together | Permission | Review member/role/action -> explain visibility/audit -> confirm | Permission denied | Together | Save/confirm | Who, what changes, audit visibility | Lightweight/preview for role/ownership | Inbox if review needed |
| Health review | Understand condition. | Home/Health | Enough facts | Review score/factors -> open source domain | Partial data/stale | Source detail/Health | View source | Factor, completeness, source link | None; Health writes forbidden | Money/Plan/Inbox |

