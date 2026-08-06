# UX Inventory

Current flows only. No redesign recommendations in this file.

## Auth and Entry

1. User lands on localized root.
2. User can open the app, switch locale, or proceed to welcome/auth.
3. User can view splash, welcome, login, register, forgot-password, or auth-confirm screens.
4. Login/register forms support credential entry, social auth entry, form validation, and error status.
5. Forgot password submits reset request and shows status/toast feedback.
6. Auth confirmation verifies link state and routes onward.

## Invite

1. User opens `/invite/[token]`.
2. App loads invitation preview and auth/session context.
3. User accepts or sees invalid/expired/auth-required states.
4. Successful acceptance routes toward household/product access.

## Onboarding

1. Authenticated user without active membership reaches `/together/onboard`.
2. User steps through `OnboardWizardScreen`.
3. Wizard collects household setup inputs.
4. Successful completion creates household context and routes into product.

## Home

1. Authenticated member opens `/home`.
2. Home dashboard loads household-level dashboard summary.
3. User sees top app bar, balance/KPI summary, health chip, inbox CTA, and day-zero actions.
4. Primary shortcuts route to capture, plan, inbox, or health-related destinations.

## Money

1. User opens `/money`.
2. Money hub shows real position, accounts/cards scan, recent transactions, capture action, and more destinations.
3. User can navigate to accounts, transactions, debts, loans, savings, and capture.
4. Accounts flow supports list, account detail, add account dialog, and account/card detail actions.
5. Transactions flow supports list/filter, new transaction capture, detail, edit, refund, and correction.
6. Debts flow supports list, create debt form, detail, and pay action.
7. Loans flow supports list, create loan form, detail, pay, edit, edit interest, and close actions.
8. Savings flow supports list, create saving wizard, detail, renewal policy editor, and early-withdraw action.
9. Offline mutation banners and status alerts appear across money mutation flows.

## Plan

1. User opens `/plan`.
2. Plan hub shows plan pulse, emergency inbox banner, and links/cards to planning destinations.
3. Jars flow supports list, active/non-target sections, create jar, create category, detail, update controls, and reallocation form.
4. Goals flow supports list, create goal, detail, contribution/update controls, and progress display.
5. Recurring flow supports list, create recurring item, detail/edit form.
6. Calendar flow shows projected household calendar and selectable day/event details.
7. Ritual flow shows monthly ritual status and a multi-step ritual wizard.
8. Plan mutation flows include offline and error status handling.

## Inbox

1. User opens `/inbox`.
2. Inbox queue loads open review items.
3. User filters or switches queue tabs.
4. User opens `/inbox/[id]` for detail.
5. Decision panel presents action options by review item type.
6. User submits decision or sees validation/offline/status feedback.

## Health

1. User opens `/health` directly or through related actions.
2. Overview loads read-only health summary.
3. User can view insights via `/health/insights`.
4. Insights page presents generated/read-only insight cards and empty/error states.

## Together

1. User opens `/together`.
2. Together hub shows household members and account lifecycle controls.
3. Invitations screen supports invite management.
4. Policies screen supports policy form editing.
5. Preferences screen shows household/together preferences.

## System

1. Error, offline, maintenance, and permission routes render outside product chrome.
2. System screens use `SystemShell` and state components instead of bottom navigation.

