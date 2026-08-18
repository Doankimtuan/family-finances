# Design taste

- Mobile-first financial app personality: light, calm, warm, modern, trustworthy, slightly expressive — "Gen Z financial life companion", never accounting software, bank back-office, enterprise SaaS, crypto/dashboard-heavy, marketing landing page, or Awwwards-style showcase. Confidence: 0.9
- Avoid excessive layout variance, oversized editorial typography, dramatic page transitions, heavy GSAP motion, random asymmetry, purposeless bento layouts, and marketing-page composition inside product screens. Confidence: 0.9
- The product character and canonical project artifacts always win over generic design-skill rules; use design-taste-frontend as the primary skill and gpt-taste only as an anti-generic reference, never applied automatically. Confidence: 0.85
- Model real financial products, not CRUD records: full lifecycle, money physically moving through a ledger, immutable product/rate snapshots and history, strongly typed ReviewItems instead of generic notifications. Confidence: 0.85
- Prefer conversational clarity over banking terminology; never expose financial formulas to users — use human language (e.g., "Fixed Monthly Payment" not "Equal Monthly Payment") and show live simulations while editing. Confidence: 0.85
- Money amounts must use tabular numerals; don't make every amount visually dominant; use color for meaning, never decoration; avoid red for ordinary overspending feedback; never encode status by color alone. Confidence: 0.8
- Prefer borders, tonal surfaces, and spacing over shadows; avoid excessive pill components. Confidence: 0.7
- Motion: feedback 120–180ms, transitions 180–250ms, meaningful completion up to 600ms; respect prefers-reduced-motion; avoid bouncing financial values, parallax, excessive page transitions, and decorative looping animation. Confidence: 0.85
- Use one consistent icon family (Phosphor preferred); illustrations only in onboarding, empty states, educational moments, and success milestones — never to replace financial clarity. Confidence: 0.7
- Data visualization: minimal ink, one question per chart, text explanation, dark-mode and color-independent readability; avoid financial-trading aesthetics and complex dashboards. Confidence: 0.75
- Guide users through progressive, step-by-step flows instead of long CRUD forms; keep actions within ~3 taps and minimize decision fatigue. Confidence: 0.8
- Prefer merging similar domain kinds/types over proliferating them; model the actual decision or outcome the user must make rather than representing each lifecycle event as a separate type. Confidence: 0.8
- Prefers the smallest data model that accurately represents real behavior: don't multiply dimensions (e.g., ownership vs visibility vs scope) unless each solves a distinct real need, avoid enterprise ACL systems, and prefer inheriting scope/ownership from a resource root over redundant per-row fields. Confidence: 0.85
- Prefers one canonical vocabulary for cross-cutting concepts (e.g., financial scope), defined once and shared by every domain — never inconsistent terminology or per-domain synonyms. Confidence: 0.7
