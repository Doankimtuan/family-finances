# Priority Matrix

## Scale

- Frequency: Daily, Weekly, Monthly, Event-based, Rare
- Implementation Cost: Low, Medium, High
- Priority: P0, P1, P2, P3

| ID | Problem | User Impact | Affected Screens | Frequency | Business Impact | Recommended UX | Implementation Cost | Priority |
|----|---------|-------------|------------------|-----------|-----------------|----------------|---------------------|----------|
| PX-01 | Real money and virtual intention can be misunderstood | Users may treat Jars or Goals as available cash | Home, Money Hub, Plan Hub, Jars, Goals, Health | Daily | High trust and BR-01 comprehension risk | Use consistent labels: "Real money", "Planned use", and "Not money moved"; place short inline explanations near first exposure | Medium | P0 |
| PX-02 | Home may carry too many concepts for day-0 users | First session feels like a dashboard instead of next step | Home, Onboarding | Daily | Activation risk | Day-0 Home should show three setup actions only: add money account, record first item, choose starter plan | Medium | P0 |
| PX-03 | Inbox can become noisy as domains expand | Users ignore important decisions | Inbox Queue, Review Detail, Home Inbox CTA | Daily/Weekly | Loss of trust in operating system | Enforce Inbox eligibility copy and bundling; show one decision question per card | Medium | P0 |
| PX-04 | Health score may feel judgmental or too precise | Anxiety, shame, or unsafe trust in a score | Home Health chip, Health Overview, Insights | Weekly/Monthly | Retention and trust risk | Use condition bands, source factors, and completeness labels; avoid blame and advice language | Medium | P0 |
| PX-05 | Month Ritual may feel too heavy | Users skip month close and lose planning rhythm | Plan Hub, Month Ritual, Inbox | Monthly | Core habit risk | Assisted ritual should be 3-5 calm steps with carry-forward defaults and visible time cost | Medium | P0 |
| PX-06 | Money Hub hides urgent obligations inside sections | Cards, loans, and savings maturity may be missed | Money Hub, Cards, Debts, Savings | Weekly/Event-based | Missed payment or decision risk | Add an "Upcoming money pressure" strip with due cards, installments, maturity, and required decisions | Medium | P1 |
| PX-07 | Product setup wizards can be too long on mobile | Users abandon savings, loan, card, or account setup | Savings, Debt Detail, Cards, Accounts | Event-based | Data completeness risk | Split into required first, optional later; persist drafts; use review step | Medium | P1 |
| PX-08 | Together policy screens may ask non-experts to configure too much | Couples choose defaults they do not understand | Together Policies, Preferences, Onboarding | Rare/Monthly | Household trust risk | Prefer recommended defaults; explain consequences only at save preview | Low | P1 |
| PX-09 | Investment loss/profit language can imply advice | Users may think ViNha recommends action | Investments surfaces, Health Insights, Inbox | Event-based | Compliance and trust risk | Use "recorded value changed" and "review facts" framing; never "buy/sell/hold" language | Medium | P1 |
| PX-10 | Category-to-Jar mapping is conceptually heavy | Capture slows; users feel punished for uncategorized expenses | Transaction Add, Inbox Review, Plan Jars | Daily | Daily-use friction | Suggest likely category and jar; allow "review later"; teach through confirmation, not setup lectures | Medium | P1 |
| PX-11 | Large forms create keyboard fatigue | Common capture exceeds 15 seconds | Transaction Add, account/savings/loan setup | Daily/Event-based | Activation and habit risk | Put amount, direction, account, category first; hide notes and advanced fields | Medium | P1 |
| PX-12 | Delight moments could slip into gamification | Users chase badges instead of discipline | Goal, Month Ritual, EMI, Savings, Health | Event-based | Philosophy risk | Use quiet acknowledgment and next responsible step, not streak pressure or points | Low | P2 |

