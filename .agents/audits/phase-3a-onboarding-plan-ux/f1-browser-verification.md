# F1 — Browser verification

## Environment and setup

- App: local Next.js 16.3.1 at `http://localhost:3100`.
- Backend: verified development/testing Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`).
- Fixture: `Together 20A` disposable household and two isolated browser contexts for the existing test identities. Account A created the pending invite for B through the product.
- Baseline reproduction: Account B logged in normally at `/en/login`, landed at `/en/together/onboard`, and saw the household naming wizard without the invitation.

## Post-fix results

- B logged in normally without opening an invitation URL and saw the invited household at `/en/together/onboard`.
- Vietnamese invitation copy appeared at `/vi/together/onboard`.
- “Create my own household” opened the existing wizard. Reloading returned to the invitation choice without creating a household.
- B accepted the invitation. Refresh redirected B to `/en/home`; the invitation did not create a second household. Both A and B then saw the same household and two membership rows in `/en/together/members`.
- Keyboard navigation reached the accept action. Dark theme and reduced-motion preference were checked. The page had no reported browser page errors.
- A read-only post-cleanup query found zero households matching the disposable fixture name. The harness removed its household fixture; temporary browser credentials and scripts were removed.

## Responsive and visual checks

Checked invitation-choice layout at 360×640, 390×844, 440×900, 768×1024, and 1280×900. No horizontal overflow was found. The screenshots are in `evidence/`:

- Before fix: `f1-invited-user-onboarding-before-fix-390.png`
- After fix: `f1-invitation-choice-360x640.png`, `f1-invitation-choice-390x844.png`, `f1-invitation-choice-440x900.png`, `f1-invitation-choice-768x1024.png`, `f1-invitation-choice-1280x900.png`
- Dark/reduced motion: `f1-invitation-choice-dark-reduced-motion-390.png`
- Vietnamese: `f1-invitation-choice-vi-390.png`
- After acceptance: `f1-invitee-shared-household-after-accept-390.png`, `f1-owner-shared-household-after-accept-440.png`

The owner invitation screen before and after is recorded in `f1-owner-pending-invitation-before-fix.png` and `f1-owner-pending-invitation-after-fix.png`.

## Limits

The browser journey exercised one pending invitation. Multiple invitations, expired, revoked, already accepted, and email-mismatch responses were verified in application unit tests, not as separate browser journeys. The existing RPC remains the authority if invitation state changes between display and acceptance.
