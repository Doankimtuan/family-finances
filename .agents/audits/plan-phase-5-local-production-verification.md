# Plan Phase 5 — Local Production Browser Verification

## 1. Local build result

- Candidate: `bun run build` passed from the current workspace with Next.js 16.3.1; TypeScript and all 111 generated static pages completed.
- Matched control: an isolated copy of the exact pre-Phase-5 source snapshot was rebuilt with `bun run build`; it also passed with Next.js 16.3.1. Plan page SHA-256: control `44d5128cd68aed345d0b57682839d32a81bca633068e03115c20f9aa09fe9528`, candidate `b8e58fc016f4bb81626d51bfe43b6615fa3a3e0b0415bca91c64d434e8096e27`.
- Each arm used its own `.next` output. No application code was changed for this verification.

## 2. Local production servers

- Candidate: `http://localhost:3000`, started with `NODE_ENV=production bun run start`; Next reported `next start` and ready.
- Control: `http://localhost:3002`, started with `NODE_ENV=production PORT=3002 HOSTNAME=127.0.0.1 bun run start`; Next reported `next start` and ready.
- Both served locally. No `next dev`, Vercel deployment, migrations, fixture setup, or E2E global setup was used.

## 3. Existing Browser MCP and authentication

Used the connected Brave Browser MCP (browser ID 1) and one task tab in that existing browser. No additional browser was created, and unrelated tabs were not used.

On both ports, navigating to `/en/login` redirected to `/en/home`; the authenticated E2E session was already valid. No login form was displayed, so no credentials were entered and no login submission was necessary. This is a valid-session result, not a login-form readiness result.

## 4. Home → Plan and financial verification

- Clicked the visible Plan link from Home through the Browser MCP UI and reached `/en/plan` on both arms.
- Both showed October 2026, the Planned/Spent/Remaining summary in VND, and six visible Jar rows.
- Compared the rendered summary value strings and the six ordered Jar-row accessibility strings inside the Browser MCP session. Summary values, row values, and row order matched exactly between control and candidate. Raw financial values were not printed or saved in this report.
- No financial mutation was performed. Inbox was not opened.

## 5. Warm navigation measurements

Collected ten warm Home → Plan samples per arm after one excluded warm-up. The same Browser MCP tab, account/session, locale (`en`), selected month, viewport, and hosted backend were used. Control was measured first and candidate second; the runs were not interleaved.

Timing began immediately before clicking Plan. After route commit, milestones were detected with Browser MCP locator `isVisible()` checks against the visible Plan heading, exact `Planned` label, and first Jar-row link. When an element was not yet visible, the browser checked again until visible; no fixed delay was used as a readiness marker. p50/p75 use Type 7 linear interpolation. Values are milliseconds.

| Milestone         | Control p50 / p75 | Candidate p50 / p75 | Candidate change |
| ----------------- | ----------------: | ------------------: | ---------------: |
| Plan heading      |         178 / 217 |       180.5 / 214.5 |    +1.4% / −1.2% |
| Financial summary | 1,714.5 / 1,934.5 |   1,575.5 / 1,663.3 |   −8.1% / −14.0% |
| First Jar row     | 1,943.5 / 2,020.5 |     1,584.5 / 1,669 |  −18.5% / −17.4% |

These are local click-to-visible-DOM milestones measured through Browser MCP. They include browser/MCP observation overhead and do not represent hosted production latency.

## 6. Candidate RSC/network observations

Across the ten measured candidate navigation windows, CDP observed 57 request events, including 19 RSC-like requests. All 19 had HTTP 200 response events; none had a captured `Network.loadingFinished` event, and 18 had canceled loading events. The windows include route prefetch/transition activity, so counts are observations rather than exact unique request totals per click. CDP saw zero direct browser-to-Supabase requests and zero non-canceled network failures. The browser cannot see server-to-server Supabase calls.

## 7. Phase 5 request behavior

The browser trace confirms successful RSC-like HTTP responses during Plan navigation, but it cannot expose timestamps for the server-side period-context lookup, budget RPC, and Plan pulse read. Server-function logging was disabled. Therefore, production request overlap and its duration were not verified live; no overlap claim is made.

## 8. Financial correctness and read-only safety

The current period matched between the two production builds. The three summary value strings and all six visible Jar-row strings, including their displayed financial data and order, matched exactly. No raw amounts, credentials, cookies, or tokens were included in tool output or this report. No account, household, jar, budget, or transaction data was changed.

## 9. Console and Browser MCP locator issue

Both arms ended with zero captured browser console errors. Candidate CDP captured no non-canceled network failures; RSC completion events were unavailable as described above.

One Browser MCP `waitFor({ state: "visible" })` call for the `Planned` text timed out even though its diagnostics reported one match and `visible: true`. A fresh DOM snapshot and direct `isVisible()` confirmed the label was rendered. The measurement therefore used direct Browser MCP visibility checks rather than that false-negative wait result. This did not occur on Login; Login redirected to Home because the session was already authenticated.

## 10. Result and limitations

In this local matched production run, the candidate reached the financial summary and first Jar row sooner at both p50 and p75; the heading timings were effectively unchanged. The measured improvement is observed for these two builds. It cannot be attributed solely to Phase 5 because the current candidate workspace already contained other changes and the arms were run sequentially rather than interleaved. Server-side overlap was not visible to Browser MCP.

Not measured: full RSC completion and server-side overlap timestamps. Risk: sequential sampling and pre-existing candidate changes limit causal attribution.

PLAN PHASE 5 VERIFIED — LOCAL PRODUCTION PERFORMANCE IMPROVED
