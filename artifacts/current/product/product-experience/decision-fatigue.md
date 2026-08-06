# Decision Fatigue

## Assessment

ViNha's philosophy requires user confirmation for meaningful financial decisions, but the UX must protect users from needless configuration. Decisions should appear only when they improve trust, safety, or household alignment.

## Fatigue Risks

| Area | Fatigue Source | Simplification |
|------|----------------|----------------|
| Onboarding | Too many setup questions | Use defaults and starter templates |
| Transaction capture | Direction, account, category, jar, note, date | Optimize common path; hide optional fields |
| Category/Jar mapping | User must understand both concepts | Suggest mapping; allow review later |
| Inbox | Too many low-value cards | Enforce eligibility and bundle |
| Policies | Abstract settings | Recommended defaults with save preview |
| Health | Too many factors and scenarios | Show top factors first |
| Month Ritual | Long checklist | Progressive assisted steps |

## Recommendations

### PX-DF-01: Default first, configure later

Problem: New families should not need to understand all settings before seeing value.

User Impact: Setup feels like homework.

Affected Screens: Onboarding, Together Policies, Plan Hub.

Frequency: First session/Rare.

Business Impact: High activation impact.

Recommended UX: Use safe defaults for jar templates, assisted ritual mode, and policy settings. Expose configuration after the first relevant moment.

Implementation Cost: Low.

Priority: P0.

### PX-DF-02: One decision per Inbox item

Problem: ReviewItems can accumulate multiple questions: category, jar, partner acknowledgement, correction, and action.

User Impact: Users hesitate or pick random outcomes.

Affected Screens: Inbox Queue, Inbox Review Detail.

Frequency: Daily/Weekly.

Business Impact: High.

Recommended UX: Every ReviewItem card asks one sentence-level decision and shows only valid outcomes for that item type.

Implementation Cost: Medium.

Priority: P0.

