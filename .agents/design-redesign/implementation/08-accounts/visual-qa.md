# Accounts Visual QA

## Sources

- Compared against the paired current Stitch records listed in `accounts-screen-map.md`.
- HTML and PNG references were fetched with `curl -L` and inspected from `/tmp/implementation-08-accounts-stitch/`.
- Browser QA used the authenticated local app in Brave. Screenshots were not saved to the repository because the real account data is private.

## Browser matrix

| Locale / theme      | Widths / screens checked                                                                 | Result                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| EN Light            | Accounts overview, Add Account, Add Credit, Asset Detail, Credit Detail at 360, 390, 430 | PASS: routes rendered and document width matched viewport.                  |
| VI Light            | Same five routes at 390                                                                  | PASS: translated labels and route links rendered; no horizontal overflow.   |
| EN Dark             | Same five routes at 390                                                                  | PASS: dark token surfaces and labels rendered; no horizontal overflow.      |
| VI Dark             | Same five routes at 390                                                                  | PASS: translated labels and dark surfaces rendered; no horizontal overflow. |
| EN Light wide shell | Overview and both create pages at 440, 768, 1280                                         | PASS: 440px centered shell and no horizontal overflow.                      |

Dark-mode screenshots used a temporary root theme class for the browser check. The persisted user theme preference was not changed. The original viewport and light theme were restored after review.

## Form and interaction checks

- Add Account shows the supported asset types and omits credit card on its dedicated route.
- Add Credit shows the supported limit, statement day, due day, linked asset account, and financial scope fields. No existing-debt field is rendered; zero-debt copy is explicit.
- Amount fields were focused at a 390×550 reduced viewport to simulate the viewport loss caused by an on-screen keyboard. The sticky action remained visible. A native mobile keyboard was not available in desktop Chromium.
- The account-type and statement-day selects opened with accessible options and closed with Escape.
- Account Edit sheet was opened and canceled without changing data. Archive confirmation was opened and canceled; no archive action was submitted.
- Form fields, account-management buttons, labelled navigation, group headings, and detail headings appeared in the accessibility tree.

## Stitch comparison and remaining gaps

- **Accounts Overview — implemented for backed data.** The real asset summary, bank group, combined cash/e-wallet group, separate credit-liability rows, and Add Credit entry are present. The canonical reference also depicts quick transaction/transfer actions and bank/provider details that have no account-prefill or provider data contract here.
- **Add Account — implemented for backed fields.** Sectioned form, shared controls, opening balance explanation, ownership scope, and sticky action are present. Provider selection and provider-specific details have no product API.
- **Add Credit Account — implemented for backed fields.** Credit limit and billing settings are distinct; the form states that new cards start with zero debt. Existing-debt entry in Stitch has no command/schema support and was not added.
- **Asset Detail — visual gap remains.** The current page shows account identity in the header, current balance/ownership in `FinancialAccountHero`, a shared capture shortcut to the general transaction flow, and typed recent activity. It does not match Stitch's separate identity card and on-page settings rows. The capture shortcut does not prefill an account; existing Edit/Archive and activity navigation remain supported.
- **Credit Detail — visual gap remains.** Current debt, limit, available credit, due facts, statement, installments, activity, payment, and management remain real. The current page structure differs from Stitch's identity/due-alert/quick-action/history/settings hierarchy. Existing card capabilities were kept intact.

No Stitch source was edited. Detail compositions and absent API/data are recorded as DESIGN GAP / DATA GAP; no mock financial values are used.
