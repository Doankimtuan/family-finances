# Domain: Together

**Bounded Context:** Tenancy
**Surface:** Together
**Financial Principle:** Collaboration, Transparency, Trust
**Business Rules:** BR-12, BR-13

---

## 1. Philosophy

Together answers the question: **who is "we"?**

Before a household can track money, plan spending, or assess health, it must define its boundary. Who belongs to this household? What can each person see and do? What policies govern shared money behavior?

The philosophical purpose of Together is *collaboration infrastructure.* ViNha is not personal finance software — it is household finance software. The household, not the individual, is the fundamental unit. Together defines the household boundary, membership, roles, and shared policies that make collaboration possible.

Together is the foundation on which everything else rests. Without a clear answer to "who is we?", the Real Ledger (whose accounts?) and the Intention Plan (whose intentions?) have no context.

---

## 2. User Problem

Couples and families managing shared money face fundamental collaboration challenges. Who can see what? Who can make which decisions? What happens when financial policies change? How do we bring a new partner into the household?

The pain is *collaboration friction.* Without explicit structures, households operate on assumptions: "I assumed you saw that transaction," "I thought we agreed on the budget." Assumptions break. Trust erodes.

Together solves this by making collaboration explicit. The household has a defined membership. Roles are clear (Partner vs. Admin). Policies are visible. Changes are transparent (BR-13). Nothing is hidden.

---

## 3. Financial Principle

**Collaboration, Transparency, and Trust.** These three principles are inseparable in household finance:

- **Collaboration:** Household finance is a team sport. The system must enable, not hinder, shared money management.
- **Transparency:** Hidden money breaks trust. Both partners must see the same financial picture.
- **Trust:** The system must earn trust before it can manage money. Explicit collaboration structures (roles, policies, visibility) build that trust.

---

## 4. Core Responsibilities

1. **Define the household.** Create the fundamental unit. A household has a name, a creation date, and an active status.
2. **Manage membership.** Who is in the household? BR-12: one active household per user in v2 Now.
3. **Define roles.** Partner (daily money access) and Admin (policy management). Partners are equal on daily money. Admins manage the framework.
4. **Manage invitations.** How do new members join? Invitation flow: Admin invites → invitee accepts → becomes Partner.
5. **Manage household policies.** Overspend policy (BR-07), income placement defaults (BR-04), Month Ritual mode (BR-09). Policies have defaults for new households.
6. **Ensure partner visibility.** BR-13: material assumption/policy changes are partner-visible via audit or notification.
7. **Support household-level settings.** Currency, language, timezone — these belong to the household, not to individual members.

---

## 5. Explicit Non-Responsibilities

1. **Together does NOT own financial data.** Accounts, Transactions, Jars — these belong to their respective domains. Together defines who can access them.
2. **Together does NOT define the IA or navigation.** The fact that "Together" is a top-level navigation surface is a product decision, not a domain responsibility.
3. **Together does NOT manage individual user profiles.** Name, email, avatar — these are user-level concerns (authentication system), not household-level concerns.
4. **Together does NOT handle authentication.** Login, password reset, MFA — these are security concerns, not domain concerns.
5. **Together does NOT enforce spending limits.** Overspend policy (BR-07) is configured in Together but enforced in Budgets.
6. **Together does NOT resolve disputes.** "My partner spent too much" — Together defines visibility and policies but does not adjudicate disagreements.

---

## 6. Domain Boundary

**IN:**
- Household definition (name, creation date, active status)
- Household membership (members and their roles)
- Roles: Partner, Admin
- Invitation flow (invite, accept, decline)
- Household-scoped policies: overspend (BR-07), income placement default (BR-04), Month Ritual mode (BR-09)
- Policy defaults for new households
- Material change audit trail (BR-13)
- Household-level settings (currency, locale)

**OUT:**
- User authentication (→ auth system)
- User profiles (→ user management)
- Account ownership (→ Accounts domain — all Accounts are household-scoped)
- Transaction visibility rules (→ Transactions domain — all Transactions are visible to all Partners)
- Jar access control (→ Budgets domain — all Jars are visible to all Partners)
- Feature flags or permission systems beyond Partner/Admin roles
- Multi-household support (→ out of scope for v2 Now; BR-12 enforces one active household)

---

## 7. Business Language

**Official Terms:**
- **Household:** The fundamental unit — the group sharing finances
- **Member:** An individual belonging to a household
- **Partner:** A member with daily money access — equal to all other Partners
- **Admin:** A member with policy management access
- **Invitation:** The mechanism for adding new members
- **Policy:** A household-level rule governing financial behavior

**Aliases:**
- "Family" is acceptable in conversational contexts but "Household" is the product term.
- "Co-manager" is acceptable for Partner but "Partner" is preferred.

**Forbidden Terminology:**
- ❌ "Owner" — implies hierarchy among partners; there is no owner in daily money
- ❌ "Primary user" — all Partners are equal
- ❌ "Read-only member" — Partners have full daily money access; there is no "view-only" role in MVP
- ❌ "Family account" — use "Household"

**Preferred Terminology:**
- ✅ "Our household has two Partners and one Admin"
- ✅ "An invites B to join the household"
- ✅ "This policy change will be visible to all Partners"

---

## 8. Mental Model

Users should think of the household as **a shared house.** Everyone living in the house (Partners) has keys to every room — they can see the kitchen (Accounts), the living room (Plan), the mail tray (Inbox). One person (Admin) has the ability to change the locks or rearrange the furniture (policies).

You would not live in a shared house where some rooms are locked to some residents. Household finance is the same: Partners share everything. There are no "my transactions" and "your transactions" — there are only "our transactions."

This mental model emphasizes that Together is about *shared space,* not about *permission hierarchies.* Every Partner sees everything. The Admin role is for policy management, not for controlling access to financial data.

---

## 9. Real-World Validation

**Household structures:** Couples, families with children, multi-generational households — the concept of a "household" as an economic unit is universal. ViNha's Together domain reflects this reality.

**Joint accounts:** Many couples operate joint bank accounts. Together formalizes what joint accounts imply: shared visibility, shared responsibility, shared decision-making.

**Financial transparency in relationships:** Financial advisors and relationship counselors consistently recommend full financial transparency between partners. Together implements this recommendation.

**Validation:** The Together domain is validated by both financial best practices and relationship research. Shared finances require shared visibility.

---

## 10. Simplicity

Together is intentionally minimal. Two roles (Partner, Admin). One active household (BR-12). A handful of policies. The simplicity is the feature.

**What could be removed?**
- For MVP, the Admin role could be collapsed — all members are Partners, and policies are set during onboarding. But Admins serve a real need for policy management.
- Policy override at the individual level — policies are household-scoped. No "my overspend policy is Allow Negative, yours is Warn."

**Resist the temptation to add:**
- Custom roles beyond Partner and Admin (e.g., "Viewer," "Contributor") — two roles is sufficient.
- Per-Jar or per-Account visibility rules — all Partners see everything.
- Approval workflows for spending — this is a future F-Approvals feature, not MVP.
- Multi-household support — BR-12 explicitly limits to one active household in v2 Now.

---

## 11. Evolution Potential

Together has significant but controlled evolution potential:

- **Multi-household support:** In future versions, a user could belong to multiple households (e.g., a couple's household and a family-of-origin household). BR-12 defers this.
- **Approval workflows:** F-Approvals could add a "spending requires partner approval" policy — but this is a separate feature.
- **Member activity visibility:** "Last active 3 days ago" — helps households understand engagement.
- **Household-level Goals:** Goals that require both Partners to contribute — already supported, but Together could add specific collaboration features.
- **Household audit log:** A complete history of all material changes with attribution (BR-13 evolution).

**The danger:** Together must not become an enterprise permissions system with roles, groups, and granular access control. ViNha is for couples and small families, not organizations.

---

## 12. Common Mistakes

**Implementation Mistakes:**
- Tying household creation to a subscription or payment plan — household creation should be part of onboarding, not gated.
- Allowing a household to have zero Admins — at least one Admin must exist.
- Failing to enforce BR-12 (one active household per user) — this is a v2 Now constraint.

**UX Mistakes:**
- Making the Together surface feel like "settings" rather than "our household."
- Displaying Partner names without context (who is who?).
- Making invitation flows complex — joining a household should be a one-click action after authentication.
- Burying policy changes — BR-13 requires visibility; changes should be surfaced, not hidden in settings.

**Business Mistakes:**
- Creating a hierarchy among Partners ("primary partner," "secondary partner") — all Partners are equal.
- Positioning Together as a "user management" feature — it is a household collaboration feature.
- Allowing policy changes without partner notification — violates BR-13 and erodes trust.

---

## 13. Success Criteria

From the user's perspective, Together is successful when:

1. **Both partners feel equally empowered** — neither feels like a "guest" in the household.
2. **Joining a household is frictionless** — one invitation, one acceptance, done.
3. **Policy changes are never a surprise** — BR-13 ensures visibility.
4. **The household boundary feels natural** — "this is our money, our plan, our decisions."
5. **Together rarely needs attention** — it is infrastructure that works quietly. The household visits Together to add a member or change a policy, not daily.

---

## 14. Product Philosophy Alignment

**ViNha as "Household Money Operating System" vs. "Expense Tracker":**

An expense tracker is inherently individual — one person tracking their spending. ViNha is inherently collaborative — two people managing shared money. Together is the domain that makes this possible.

Together embodies **Partners first.** This is not just a product principle — it is the domain's reason for existing. Every design decision in Together should be evaluated against: "does this make collaboration easier or harder?"

Together embodies **Household privacy.** The household is a private space. Members are explicit. Invitations are controlled. There is no "public" household or social sharing.

Together embodies **Calm finance UI.** The Together surface should feel warm and human — photos, names, a sense of "us" — not like an enterprise admin panel.

---

## Domain Score

| Criterion | Score (1-10) | Justification |
|-----------|-------------|---------------|
| Business Clarity | 9 | Clear purpose: define the household boundary and enable collaboration |
| Financial Correctness | 9 | Reflects real household structures and shared-finance best practices |
| User Value | 9 | Essential for the product's core value proposition — without Together, ViNha is just another personal finance app |
| Longevity | 9 | Household structures are permanent |
| Extensibility | 7 | Multi-household, approval workflows possible; fundamentally constrained by small-group focus |
| Simplicity | 9 | Two roles, one household — intentionally minimal |
| Future Evolution | 7 | Controlled evolution; must resist enterprise-ification |

**Overall: 8.4 / 10** — Foundational domain. Without it, ViNha has no identity as household software. Simple and correct by design.
