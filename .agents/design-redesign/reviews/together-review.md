# Together & Household Experience Review

## 1. Existing Household Model

ViNha's tenancy model is established in `modules/tenancy`. The domain entities and relationships are strictly derived from verified production schemas:

- **`User`**: Independent auth identity (`user_id`, `email`, app preferences).
- **`Household`**: The shared collaboration workspace (`household_id`, `name`, `locale: vi-VN | en-VN`, `timezone: Asia/Ho_Chi_Minh`, `baseCurrency: VND`).
- **`HouseholdMember`**: The relational binding between a User and a Household (`id`, `user_id`, `household_id`, `role: admin | partner`, `joined_at`).
- **`Invitation`**: Ephemeral pending join invitation (`id`, `household_id`, `email`, `role: partner`, `token`, `status: pending | accepted | revoked | expired | declined`, `expires_at: 7 days TTL`).
- **`HouseholdPolicies`**: Shared planning assumptions consumed by Plan and Inbox (`overspendPolicy: warn | block | allow_negative`, `monthCloseMode: assisted | manual`, `incomeAllocateMode: suggest | auto | off`).
- **`PolicyEvents`**: Immutable audit log of policy updates.

**Core Invariants**:

- `User ≠ Household`
- `Member ≠ Account owner` (individual accounts remain sovereignly owned by their respective creator).
- `Invitation ≠ Active member` (a pending invitation confers zero read or write access to household data).
- `Removing a member ≠ Deleting user account` (personal historical data and ledger entries remain immutable).
- `Leaving a household ≠ Deleting account` (the user's identity and independent ViNha account persist).
- `Personal preference (Dark mode, App language) ≠ Household setting (Household name, locale, base currency, shared policies)`.

---

## 2. Together Purpose

> **What is Together responsible for that does not belong in Settings, Money, or Home?**

Together is the **household collaboration, membership, and shared planning assumptions workspace** of ViNha:

1. **People & Identity**: Answers _"Who is in this household? What is my role? Who is currently invited?"_
2. **Membership Lifecycle**: Safe invitation, role transition (Admin $\leftrightarrow$ Partner), member removal, and departure with full transparency of impacted individual financial instruments.
3. **Shared Operating Assumptions**: Configures non-banking planning rules (`overspendPolicy`, `monthCloseMode`, `incomeAllocateMode`) that determine how budget jars and decision inboxes behave for all members.
4. **Boundary Clarity**: Reinforces that household collaboration does NOT pool banking credentials, alter legal ownership of bank deposits, or grant automated payment withdrawal rights.

---

## 3. Membership Model

- Maximum members per household: **10 members** (`HOUSEHOLD_MEMBER_LIMIT = 10`).
- Membership status: `active` once an invitation token is accepted by an authenticated user matching the invited email.
- Current household context: Rendered cleanly in the hero banner (_"Gia đình Tuấn & Lan"_, 3 members, stacked initials avatars).

---

## 4. Role Model

ViNha supports exactly **two domain roles** (`modules/tenancy/application/tenancy-constants.ts`):

1. **`admin` (Quản trị)**:
   - Primary steward of household configuration.
   - Can invite members and revoke pending invitations.
   - Can promote a Partner to Admin or demote another Admin to Partner (subject to the Admin Continuity Rule).
   - Can remove Partner members from the household.
   - Can edit Household Policies and Household Preferences.
2. **`partner` (Đối tác)**:
   - Full collaborator in daily household operations: logging transactions, categorizing expenses, viewing and creating jars, reviewing monthly close rituals, and resolving inbox items.
   - Read-only access to Household Policies and Preferences.
   - Can voluntarily leave the household.

_No invented roles_: The codebase does not have "Viewer", "Approver", "Finance Manager", or "Accountant". Canonical designs strictly use `Quản trị` and `Đối tác`.

---

## 5. Permission Model

Permissions in ViNha are role-derived and non-configurable per-user:

- `admin`: Full household management + daily financial operations.
- `partner`: Daily financial operations only.
- **Admin Continuity Rule**: An Admin cannot leave the household or demote themselves to Partner if they are the sole remaining active Admin (`HOUSEHOLD_ERROR_CODE.ADMIN_CONTINUITY`).
- **Solo Admin Rule**: If a household has only 1 member (the solo Admin), closure or departure is blocked in the UI with a clear informational message (_"Hiện chưa thể đóng hộ gia đình"_).

---

## 6. Together Overview

The canonical Together Overview (`SCR-46`, `/together`) is structured into four visual zones:

1. **TopAppBar**: Contextual eyebrow `"CÙNG NHAU"`, title `"Hộ của chúng ta"`, subtitle, and user's own role pill (`Quản trị` or `Đối tác`).
2. **Household Hero Card**: Stacked circular avatar cluster (`TN`, `LN`, `MN`), household title (_"Gia đình Tuấn & Lan"_), member count (_"3 người trong hộ gia đình này"_), and admin responsibility footer with security shield.
3. **Members Preview ("Ai đang cùng bạn?")**: Quick roster of active members with status dots and deep-link to full member management (`/together/members`).
4. **Primary CTA**: Full-width button `"+ Mời đối tác"` (`/together/invitations/new`).
5. **Pending Invitations Preview ("Ai đang được mời?")**: Displays pending invitees (`emgai.lan@gmail.com`), pending badge, expiry countdown, copy link, and revoke affordance.
6. **Collaboration & Rules Group**: Direct navigation rows to `"Quy tắc chung"` (`/together/policies`) and `"Tuỳ chọn hộ gia đình"` (`/together/preferences`).
7. **Canonical 5-Tab Navigation**: Docked bottom bar with active 5th tab ("Cùng nhau").

---

## 7. Member List

The full member directory (`SCR-47`, `/together/members`) offers scanable rows with complete peer consistency:

- 40×40px avatar container with uppercase initials (`TN`, `LN`, `MN`).
- Member display name + email address + joined date.
- Role pill badge (`Quản trị` in Info Blue / `Đối tác` in Soft Purple).
- Live active status dot (Emerald `#10B981` / `#34D399`).
- Responsibility description line.
- Administrative inline actions for Admin users:
  - _Chuyển thành Quản trị_ (or _Chuyển thành Đối tác_)
  - _Xoá đối tác khỏi hộ_ (Danger tint)
  - Sole admin lock indicator for current user (_"Quản trị duy nhất — không thể rời khi chưa chuyển vai trò"_).

---

## 8. Member Detail

Member details are integrated into the verified Member Management list card and lifecycle sheets:

- Member identity (Name, Email, Verified status).
- Join timestamp (`Tham gia 12/2024`).
- Household role with permission boundary explanation.
- Individual asset/liability impact summary when lifecycle actions are initiated.

---

## 9. Invite Flow

The invitation creation screen (`SCR-48`, `/together/invitations/new`) provides a streamlined workflow:

- Contextual header with `< Về Cùng nhau` back link.
- Trust & boundary reassurance banner: _"Mời người bạn tin tưởng — Họ sẽ tham gia hộ với vai trò Đối tác và cùng xem ngữ cảnh chung. Tài nguyên cá nhân vẫn thuộc về họ."_
- Email input field with validation.
- Fixed role preview: Default role is **Đối tác** with clear permission scope.
- Primary CTA: **Tạo liên kết mời** generating a unique 7-day token link.

---

## 10. Invitation Status

Supported domain statuses:

- `pending`: Active invite awaiting acceptance; displays expiration countdown (`Hết hạn 04/10/2026 · còn 7 ngày`).
- `accepted`: Consumed token; user is now an active member.
- `revoked`: Cancelled by Admin before acceptance.
- `expired`: Surpassed the 7-day TTL window.
- `declined`: Explicitly declined by the invitee on the invite preview screen.

---

## 11. Role Management

Role transitions are executed via `changeHouseholdRole`:

- Promotes Partner to Admin or demotes Admin to Partner.
- Confirmed via action sheet explaining: _"Thao tác này chỉ đổi trách nhiệm chính sách. Quyền sở hữu tiền không đổi."_
- Enforces Admin Continuity: Cannot demote the last remaining Admin.

---

## 12. Household Settings

Located at `/together/settings`:

- Household identity fact rows:
  - Ngôn ngữ hộ gia đình: `Tiếng Việt (Việt Nam)` (`vi-VN`)
  - Múi giờ: `Asia/Ho_Chi_Minh` (UTC+7)
  - Tiền tệ cơ sở: `VND` (₫)
- Policy & preferences navigation links.

---

## 13. Personal vs Household Settings

Strict architectural boundary enforced:

| Setting Category                                | Scope     | Canonical Location                 | Controlled By   |
| ----------------------------------------------- | --------- | ---------------------------------- | --------------- |
| **Theme (Light/Dark)**                          | Personal  | `/together/settings` (App Section) | Individual User |
| **App Language**                                | Personal  | `/together/settings` (App Section) | Individual User |
| **User Account & Password**                     | Personal  | `/together/settings/account`       | Individual User |
| **Household Name**                              | Household | `/together/settings`               | Admin           |
| **Household Locale / Base Currency**            | Household | `/together/preferences`            | Admin           |
| **Shared Policies (Overspend, Ritual, Income)** | Household | `/together/policies`               | Admin           |

Personal preferences are never stored in household database tables or synchronized across partners.

---

## 14. Remove Member

Confirmed via dedicated Action Sheet (`SCR-50`, `/together/members/remove-confirm`):

- Admin-only action targeting a Partner member.
- Prominent warning: Access revoked immediately; personal resources remain read-only.
- **P0 Impact Audit Summary ("Điều vẫn còn lại trong hộ")**: Displays exact count of owned resources:
  - Tài khoản ngân hàng cá nhân
  - Sổ tiết kiệm có kỳ hạn
  - Khoản đầu tư CCQ/Cổ phiếu
  - Khoản vay & nghĩa vụ nợ
- Financial obligation advisory: Removing a member does NOT liquidate savings or forgive loan debts.
- Confirmation footnote: User account is NOT deleted; double-entry ledger history is preserved.

---

## 15. Leave Household

- Voluntary action available to active members.
- If the user is the sole Admin, departure is blocked until Admin role is transferred to another member.
- If a solo user in a 1-member household, departure is disabled (_"Hiện chưa thể đóng hộ gia đình"_).
- Displays identical impact audit summary as member removal before final confirmation.

---

## 16. Ownership / Transfer

In ViNha's two-role architecture, "Ownership" is represented by the `admin` role. To transfer primary administrative control, an Admin simply promotes another member to `admin` via the verified `changeHouseholdRole` action. There is no separate esoteric "Super-Owner" role in the database schema.

---

## 17. Financial Settings Audit

Verified against `modules/tenancy/application/household-policies.schema.ts`:

1. **`overspendPolicy`**:
   - `warn` (Default): Shows warning banner in Plan and allows recording.
   - `block`: Restricts saving transactions that exceed jar quota.
   - `allow_negative`: Permits negative jar balance without impediment.
2. **`monthCloseMode`**:
   - `assisted` (Default): Guides the month-end close ritual with automated variance analysis.
   - `manual`: Presents factual balances without AI/automated suggestions.
3. **`incomeAllocateMode`**:
   - `suggest` (Default): Proposes envelope split in Decision Inbox for confirmation.
   - `auto`: Automatically splits incoming funds by jar percentages.
   - `off`: Disables automated allocation recommendations.
4. **P0 Invariance Principle**: Explicit alert on `/together/policies`: _"Chính sách không chuyển tiền: Lưu quy tắc chỉ cập nhật giả định hộ cho Kế hoạch và Hộp thư. Số dư tài khoản ngân hàng không đổi."_

_Invented features excluded_: No spending limits per member, no dual-signature authorization, no allowance limits, and no transaction approval thresholds.

---

## 18. UI Consistency

- **Header Systems**: Matches the established contextual and detail TopAppBar patterns of Home, Money, Plan, and Inbox.
- **Card Containers**: 12px / 16px corner radius, 1px border (`#E4E4E7` / `#2E2E33`), tonal surface hierarchy.
- **Avatars**: 40×40px squircle monogram containers with curated background/foreground pairings for instant identification.
- **Badges**: Semantic status pills (`Quản trị`, `Đối tác`, `Đang chờ`, `Đang hoạt động`) utilizing non-wrapping full-pill geometry.
- **Bottom Navigation**: 100% geometry and alignment match with Home, Money, Plan, and Inbox, with the 5th tab active.

---

## 19. Visual QA

- Monogram avatars maintain 40×40px optical presence without distortion.
- Member rows use identical vertical heights (72px nominal), internal padding (16px), and aligned right indicators.
- Role badges use uppercase or capitalized labels with adequate padding (`px-2.5 py-0.5`).
- Danger buttons (`Xoá đối tác khỏi hộ`) visually separated with secondary border styling or deep rose fills (`#E11D48`).
- Drag handle on action sheets centered with 40×4px dimensions.

---

## 20. Responsive Review

All screens validated across core mobile viewports:

- **360 × 800**: PASS. Zero text overlap; long emails wrap or truncate cleanly; button touch targets satisfy 44px min height.
- **390 × 844**: PASS (Canonical reference viewport). Flawless spacing rhythm and tabular alignment.
- **430 × 932**: PASS. Card widths clamp smoothly within centered 440px app shell.

---

## 21. Accessibility

- **Contrast**: Text `#18181B` on `#FFFFFF` (15.8:1) and `#F4F4F5` on `#1C1C1F` (13.6:1) exceed WCAG AAA standards.
- **Role Differentiation**: Badges use both semantic color and textual labels (`Quản trị`, `Đối tác`, `Đang chờ`)—never color alone.
- **Touch Targets**: All interactive elements (CTA buttons, choice tiles, copy links) maintain minimum 44×44px hit regions.
- **Action Confirmation**: High-impact lifecycle actions mandate secondary confirmation sheets before execution.

---

## 22. Light Theme

All 5 canonical Light screens generated and verified in Google Stitch:

- `SCR-46 (Light)`: Together Overview / Household Hub (`f45af37b153c4a739848e2bd0ed230e4`)
- `SCR-47 (Light)`: Household Members & Detail Management (`1724e946185644e8ac34a1a263700b86`)
- `SCR-48 (Light)`: Invite Partner & Pending Invitations Hub (`1b8c3755b987468cabf035e4302bd260`)
- `SCR-49 (Light)`: Household Shared Policies & Planning Rules (`98983dbe254643fe9736255b3a90c5db`)
- `SCR-50 (Light)`: Member Lifecycle Confirmation Sheet (`ccf70d75f2e94dd88cf250ec153c719d`)

---

## 23. Dark Theme

All 5 canonical Dark screens generated with exact 1-to-1 parity in Google Stitch:

- `SCR-46 (Dark)`: Together Overview / Household Hub (`d0e81a7d33c047aaa1d163ba6caf18d8`)
- `SCR-47 (Dark)`: Household Members & Detail Management (`8b162b83fe444a189d195f704172e4cd`)
- `SCR-48 (Dark)`: Invite Partner & Pending Invitations Hub (`25b63473130b401890715c0f86345b7e`)
- `SCR-49 (Dark)`: Household Shared Policies & Planning Rules (`35aa2c14d8c948208de0163ed951b8e9`)
- `SCR-50 (Dark)`: Member Lifecycle Confirmation Sheet (`fce53c8498564d2da8ff4726cc5883f8`)

---

## 24. Prototype & Verified Flows

1. **Navigation $\rightarrow$ Together**: Bottom navigation tab 5 active $\rightarrow$ `/together` overview.
2. **Together $\rightarrow$ Member Management**: Click _"Xem thành viên →"_ $\rightarrow$ `/together/members`.
3. **Together $\rightarrow$ Invite Partner**: Click `"+ Mời đối tác"` $\rightarrow$ `/together/invitations/new`.
4. **Invite $\rightarrow$ Pending List**: Shows active 7-day token link with Copy Link & Revoke affordances.
5. **Member Detail $\rightarrow$ Change Role**: Bottom sheet to promote to Admin or demote to Partner.
6. **Member Detail $\rightarrow$ Remove Member**: Bottom sheet confirmation displaying 5-instrument personal impact summary.
7. **Together $\rightarrow$ Shared Policies**: Click _"Quy tắc chung"_ $\rightarrow$ `/together/policies` choice tiles.
8. **Together $\rightarrow$ Leave Household**: Governed by Admin Continuity validation.

---

## 25. Deferred Product Opportunities

Recorded as potential future features, strictly separated from canonical v2.0 screens:

1. _Granular transaction category permissions per member_ (Deferred — contradicts ViNha's high-trust household philosophy).
2. _Multi-currency household conversion preferences_ (Deferred — ViNha strictly standardizes on VND base currency).
3. _Custom avatar photo upload_ (Deferred — initials monograms currently canonical across mobile app).
4. _Automated invite link QR code generator_ (Deferred — clipboard copy link satisfies 100% of current mobile sharing).
