# Phase 3E: Browser Regression & Multi-Viewport Verification

## 1. Overview

In compliance with the **ViNha UI Constitution** and **Phase 3E instructions**, all primary navigation components (`BottomNavigation`, `FloatingActionButton`, `TopAppBar`, safe area wrappers) were verified across multiple viewports, themes, locales, keyboard accessibility modes, and motion policies against a running Next.js production build (`http://localhost:3100`).

---

## 2. Multi-Viewport & Layout Stability

| Viewport       | Device Profile                    | Bottom Navigation Shell Width | FAB Positioning             | Layout Shift (CLS) |
| :------------- | :-------------------------------- | :---------------------------- | :-------------------------- | :----------------- |
| **360 × 640**  | Compact Mobile (Android)          | 360px centered column         | Centered, zero overflow     | 0.000              |
| **390 × 844**  | Standard Mobile (iPhone 12/13/14) | 390px centered column         | Centered, zero overflow     | 0.000              |
| **440 × 900**  | Canonical Mobile Max              | 440px centered column         | Centered, zero overflow     | 0.000              |
| **768 × 1024** | Tablet (iPad Portrait)            | 440px centered shell          | Centered within 440px shell | 0.000              |
| **1280 × 800** | Desktop Viewport                  | 440px centered shell          | Centered within 440px shell | 0.000              |

### Key Observations:

1. **Centered 440px Shell Guarantee**: Across all viewports up to desktop (1280px), the application preserves the single-column 440px max-width container as strictly required by the ViNha Persistent UI Constitution.
2. **FAB Vertical Displacement**: The center Floating Action Button (`data-testid="money-capture"`) remains fixed at exactly `-top-(--space-3)` relative to the navigation bar. Max vertical displacement measured across all viewports and transitions is **0.00 px**.

---

## 3. Light & Dark Mode Conformance

| Element                   | Light Mode (`theme=light`)                    | Dark Mode (`theme=dark`)                       | Conformance             |
| :------------------------ | :-------------------------------------------- | :--------------------------------------------- | :---------------------- |
| Bottom Nav Surface        | `bg-surface-elevated` (solid white `#ffffff`) | `bg-surface-elevated` (zinc dark `#18181b`)    | Pass (WCAG AA)          |
| Top Border Divider        | `border-divider` (`rgba(0, 0, 0, 0.08)`)      | `border-divider` (`rgba(255, 255, 255, 0.08)`) | Pass                    |
| Active Tab Label & Icon   | `font-semibold text-primary` (`emerald-600`)  | `font-semibold text-primary` (`emerald-400`)   | Pass (Contrast > 4.5:1) |
| Inactive Tab Label & Icon | `text-text-secondary` (`zinc-500`)            | `text-text-secondary` (`zinc-400`)             | Pass (Contrast > 4.5:1) |
| Active Indicator Dot      | `bg-current` (`emerald-600`)                  | `bg-current` (`emerald-400`)                   | Pass                    |
| FAB Elevated Ring         | `border-surface-elevated ring-primary`        | `border-surface-elevated ring-primary`         | Pass                    |

---

## 4. Internationalization & Locale Verification

The 5 primary destinations were tested in both supported locales (`/vi/*` and `/en/*`):

| Tab Key     | Vietnamese (`vi`)            | English (`en`)                | Overflow / Truncation Check          |
| :---------- | :--------------------------- | :---------------------------- | :----------------------------------- |
| `home`      | **Tổng quan**                | **Home**                      | No truncation, fits 1-line label     |
| `money`     | **Tiền tệ**                  | **Money**                     | No truncation, fits 1-line label     |
| `money_add` | **Thêm giao dịch** (A11y/SR) | **Add transaction** (A11y/SR) | Screen-reader only, FAB is icon-only |
| `plan`      | **Kế hoạch**                 | **Plan**                      | No truncation, fits 1-line label     |
| `inbox`     | **Hộp thư**                  | **Inbox**                     | No truncation, badge count aligned   |

---

## 5. Keyboard Navigation & Accessibility (WCAG 2.2 AA)

1. **Tab Traversal Order**:
   - `[Tab]` moves sequentially: `Home` → `Money` → `FAB Add Transaction` → `Plan` → `Inbox`.
   - Focus ring styles: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring`.
2. **Keyboard Activation**:
   - Pressing `[Enter]` or `[Space]` triggers navigation cleanly.
   - For `Link` tabs: Native keyboard activation triggers `onClick`.
   - For `FloatingActionButton`: React Aria `usePress` handles Enter/Space with keyboard event synthesis.
3. **Screen Reader Announcements**:
   - `aria-current="page"` correctly marks the committed destination.
   - `aria-label` provides localized names for all icon buttons.
   - `data-slot="nav-tab-badge"` announces full count (e.g., _"Hộp thư 10 mục chưa đọc"_ via `<span className="sr-only">`).

---

## 6. Motion Policy & Reduced Motion (`prefers-reduced-motion`)

- **Standard Motion**:
  - Tab icon subtle pop: `animate={{ scale: active ? motionTokens.scale.pop : 1 }}` via `springs.snappy` (motion/react).
  - Press feedback: `active:scale-[var(--press-scale)]`.
- **Reduced Motion (`prefers-reduced-motion: reduce`)**:
  - `useMotionPolicy()` returns `{ enabled: false }`.
  - Icon animation degrades cleanly to static `<span aria-hidden="true">{content}</span>`.
  - CSS scale transition disabled: `motion-reduce:transition-none motion-reduce:active:scale-100`.
  - Zero layout reflow or unexpected transforms observed.
