# Screen Catalog

Canonical screen list. No UI layout is defined here.

| Screen | Purpose | Owner | Parent | Children | Entry | Exit | Dependencies |
|---|---|---|---|---|---|---|---|
| Public Entry | Localized entry and app opening. | `tenancy` | App | Welcome/Login/Register | Direct `/` | Auth/product route | i18n |
| Welcome | Introduce entry choices. | `tenancy` | Public Entry | Login/Register | Public Entry | Login/Register | i18n |
| Splash | Transitional auth/product resolver. | `tenancy` | Public Entry | None | Auth redirects | Home/Login/Onboard | session |
| Login | Sign in. | `tenancy` | Auth | Forgot/Register/Auth Confirm | Welcome/direct | Home/Onboard | platform auth |
| Register | Create account. | `tenancy` | Auth | Auth Confirm/Onboard | Welcome/direct | Home/Onboard | platform auth |
| Forgot Password | Request password reset. | `tenancy` | Auth | None | Login | Login | platform auth |
| Auth Confirm | Confirm auth link. | `tenancy` | Auth | None | Email deep link | Home/Login/Onboard | platform auth |
| Invite Accept | Review and accept invite. | `tenancy` | Invite | Login/Register if needed | Invite link | Together/Home/Onboard | household invitation |
| Together Onboard | Create or join household context. | `tenancy` | Onboarding | None | Auth gate | Home | membership |
| Home Dashboard | Orient household and launch key work. | `home` | Product | None | Bottom tab/auth completion | Money/Plan/Inbox/Together/Health | summaries |
| Money Overview | Show financial reality overview and route to money work. | `ledger` | Product | Accounts/Transactions/Products | Bottom tab/Home | Money child screens | tenancy, ledger |
| Accounts | Browse accounts. | `ledger` | Money | New Account/Account Detail | Money Overview | Account Detail/Money | ledger |
| New Account | Create one account. | `ledger` | Accounts | None | Accounts/Money Overview | Account Detail/Accounts | tenancy |
| Account Detail | Inspect one account and its history/actions. | `ledger` | Accounts | Account actions | Accounts/deep link | Accounts/Transactions | ledger |
| Transactions | Browse transaction history. | `ledger` | Money | New/Detail | Money Overview/Home | Transaction Detail/Money | ledger |
| New Transaction | Capture one transaction. | `ledger` | Transactions | None | Home/Money/Transactions | Transaction Detail/Transactions | ledger, plan context if category/jar displayed |
| Transaction Detail | Inspect one transaction. | `ledger` | Transactions | Edit/Refund/Correct | Transactions/deep link | Transactions | ledger |
| Edit Transaction | Edit one transaction. | `ledger` | Transaction Detail | None | Transaction Detail | Transaction Detail | ledger |
| Refund Transaction | Refund one transaction. | `ledger` | Transaction Detail | None | Transaction Detail/Inbox | Transaction Detail/Inbox | ledger, inbox if launched from review |
| Correct Transaction | Correct one transaction. | `ledger` | Transaction Detail | None | Transaction Detail/Inbox | Transaction Detail/Inbox | ledger, inbox if launched from review |
| Money Products | Browse money product groups. | `ledger` | Money | Debts/Loans/Savings | Money Overview | Product lists | ledger, savings |
| Debts | Browse debts. | `ledger` | Money Products | New Debt/Debt Detail | Money Products | Debt Detail | ledger |
| New Debt | Create one debt. | `ledger` | Debts | None | Debts | Debt Detail/Debts | ledger |
| Debt Detail | Inspect one debt. | `ledger` | Debts | Pay Debt | Debts/deep link | Debts | ledger |
| Pay Debt | Pay one debt. | `ledger` | Debt Detail | None | Debt Detail | Debt Detail | ledger |
| Loans | Browse loans. | `ledger` | Money Products | New Loan/Loan Detail | Money Products | Loan Detail | ledger |
| New Loan | Create one loan. | `ledger` | Loans | None | Loans | Loan Detail/Loans | ledger |
| Loan Detail | Inspect one loan. | `ledger` | Loans | Pay/Edit/Interest/Close | Loans/deep link | Loans | ledger |
| Pay Loan | Record one loan payment. | `ledger` | Loan Detail | None | Loan Detail | Loan Detail | ledger |
| Edit Loan | Edit one loan. | `ledger` | Loan Detail | None | Loan Detail | Loan Detail | ledger |
| Edit Loan Interest | Edit one loan interest setup. | `ledger` | Loan Detail | None | Loan Detail | Loan Detail | ledger |
| Close Loan | Close one loan. | `ledger` | Loan Detail | None | Loan Detail | Loans/Money Products | ledger |
| Savings | Browse savings products. | `savings` | Money Products | New Saving/Saving Detail | Money Products | Saving Detail | savings, ledger |
| New Saving | Create one saving product. | `savings` | Savings | None | Savings | Saving Detail/Savings | savings, ledger |
| Saving Detail | Inspect one saving product. | `savings` | Savings | Renewal/Early Withdraw | Savings/deep link | Savings | savings, ledger |
| Renewal Policy | Edit saving renewal behavior. | `savings` | Saving Detail | None | Saving Detail | Saving Detail | savings |
| Early Withdraw | Withdraw early from one saving product. | `savings` | Saving Detail | None | Saving Detail/Inbox | Saving Detail/Inbox | savings, ledger |
| Plan Overview | Show planning pulse and route to planning work. | `plan` | Product | Jars/Goals/Recurring/Calendar/Ritual | Bottom tab/Home | Plan child screens | plan, inbox signals |
| Jars | Browse jars. | `plan` | Plan | New Jar/New Category/Jar Detail | Plan Overview | Jar Detail | plan, ledger categories |
| New Jar | Create one jar. | `plan` | Jars | None | Jars | Jar Detail/Jars | plan |
| New Category | Create one category for planning allocation. | `ledger` | Jars | None | Jars | Jars | ledger, plan context |
| Jar Detail | Inspect one jar. | `plan` | Jars | Edit/Reallocate | Jars/deep link | Jars | plan, inbox signals |
| Edit Jar | Edit one jar. | `plan` | Jar Detail | None | Jar Detail | Jar Detail | plan |
| Reallocate Jar | Reallocate one jar. | `plan` | Jar Detail | None | Jar Detail | Jar Detail | plan |
| Goals | Browse goals. | `plan` | Plan | New Goal/Goal Detail | Plan Overview | Goal Detail | plan |
| New Goal | Create one goal. | `plan` | Goals | None | Goals | Goal Detail/Goals | plan |
| Goal Detail | Inspect one goal. | `plan` | Goals | Edit/Contribute | Goals/deep link | Goals | plan |
| Edit Goal | Edit one goal. | `plan` | Goal Detail | None | Goal Detail | Goal Detail | plan |
| Contribute to Goal | Contribute to one goal. | `plan` | Goal Detail | None | Goal Detail | Goal Detail | plan |
| Recurring | Browse recurring items. | `plan` | Plan | New Recurring/Recurring Detail | Plan Overview | Recurring Detail | plan |
| New Recurring | Create one recurring item. | `plan` | Recurring | None | Recurring | Recurring Detail/Recurring | plan |
| Recurring Detail | Inspect one recurring item. | `plan` | Recurring | Edit Recurring | Recurring/deep link | Recurring | plan |
| Edit Recurring | Edit one recurring item. | `plan` | Recurring Detail | None | Recurring Detail | Recurring Detail | plan |
| Calendar | Browse household projection calendar. | `plan` | Plan | None | Plan Overview | Plan Overview | plan |
| Ritual | Run or inspect household ritual. | `plan` | Plan | None | Plan Overview | Plan Overview | plan |
| Inbox Queue | Browse review items. | `inbox` | Product | Review Detail | Bottom tab/Home/contextual | Review Detail | inbox |
| Review Detail | Inspect and decide one review item. | `inbox` | Inbox Queue | Decision Panel | Inbox/deep link | Inbox/object detail | inbox, owner module action |
| Together Overview | Household overview and management launcher. | `tenancy` | Product | Members/Invitations/Policies/Preferences/Settings | Bottom tab/Home | Together children | tenancy |
| Members | Browse household members. | `tenancy` | Together | None | Together Overview | Together | tenancy |
| Invitations | Manage invitations. | `tenancy` | Together | New Invitation | Together Overview | Together | tenancy |
| New Invitation | Create one invitation. | `tenancy` | Invitations | None | Invitations | Invitations | tenancy |
| Policies | Manage household policies. | `tenancy` | Together | None | Together Overview | Together | tenancy, plan constants if displayed |
| Preferences | Manage household preferences. | `tenancy` | Together | None | Together Overview | Together | tenancy |
| Settings | Manage household/account settings. | `tenancy` | Together | Account Settings | Together Overview | Together | tenancy |
| Account Settings | Manage account lifecycle. | `tenancy` | Settings | None | Settings | Settings/Auth | tenancy |
| Health Overview | Show read-only household health. | `health` | Product secondary | Health Insights | Home/direct | Home/Insights | health |
| Health Insights | Show read-only insights. | `health` | Health Overview | None | Health Overview/direct | Health Overview | health |
| Error | Explain unrecoverable error state. | `platform` | System | None | System redirect | Safe route | platform |
| Offline | Explain offline state. | `platform` | System | None | System redirect | Safe route | platform |
| Maintenance | Explain maintenance state. | `platform` | System | None | System redirect | Safe route | platform |
| Permission | Explain permission state. | `tenancy` | System | None | Auth/product guard | Safe route | tenancy |

