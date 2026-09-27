# Component Gap Audit — Auth & Onboarding Extensions

## 1. Audit Overview

During the design of the Auth and Onboarding experience, 4 recurring patterns were audited against the Task 11 Component System. Rather than creating ad-hoc, one-off elements, each pattern was formally consolidated into the design system as a composable primitive or pattern.

---

## 2. Component Extension Specifications

### A. Revealable Password Input (`<PasswordInput>`)

- **Origin**: Needed across Login, Register, and Reset Password.
- **Classification**: **JUSTIFIED EXTENSION** of `TextInput` (`INP-01`).
- **Anatomy**:
  - Inherits standard 48px height, 10px radius, 1px border.
  - Leading slot: 20px lock icon (`LockPasswordIcon`).
  - Input: `type="password"` by default.
  - Trailing slot: 44×44px interactive eye toggle button (`showPassword` / `hidePassword`).
  - Accessibility: `aria-label="Hiện mật khẩu"` / `aria-label="Ẩn mật khẩu"`; tapping toggles `type="text"` / `type="password"` without resetting cursor position.

### B. OAuth Provider Button (`<AuthProviderButton>` / `<SocialButton>`)

- **Origin**: Needed for Google and Apple Sign-In across Login and Register.
- **Classification**: **JUSTIFIED EXTENSION** of `Button` Outlined variant (`ACT-01`).
- **Anatomy**:
  - Height: 44px standard.
  - Border: 1px solid `--vn-border`.
  - Leading slot: 20px official provider logo (Google colored 'G' mark; Apple monochrome silhouette).
  - Label: Centered text (e.g. _"Tiếp tục với Google"_).
  - States: Default, Hover, Pressed, Loading (displays spinner with _"Đang tiếp tục…"_), Disabled.

### C. Step Progress Indicator (`<StepProgress>`)

- **Origin**: Needed for the 2-step Onboarding Wizard (`/together/onboard`).
- **Classification**: **COMPOSITION** of `ProgressBar` (`DAT-04`) and `Text` (`--vn-font-label-md`).
- **Anatomy**:
  - Line 1: Centered or left-aligned step count (e.g. _"Bước 1 / 2"_).
  - Line 2: 4px high linear progress bar (`value={1}`, `max={2}` -> 50% width).
  - Accessibility: `aria-valuenow="1"`, `aria-valuemax="2"`, `aria-valuetext="Bước 1 trên 2"`.

### D. Choice Tile Selector (`<ChoiceTile>` & `<ChoiceTileGroup>`)

- **Origin**: Used for Plan Preset selection (`Cân bằng`, `Đơn giản`, `Thiết lập sau`) in Onboarding Step 2 and Policies in Together.
- **Classification**: **CANONICAL SELECTION COMPONENT** (`SEL-06` Radio tile).
- **Anatomy**:
  - Container: 10px radius, 1px solid border (`--vn-border` resting / `--vn-primary` selected).
  - Background: Surface white resting / `--vn-primary-soft` selected.
  - Content: 24px icon + Title (14px 600-weight) + Description (12px muted).
  - Selection indicator: Teal radio ring or checkmark.

---

## 3. Compliance Summary

- **One-Off Components Created**: 0.
- **Task 11 Component Compliance**: 100% compliant.
- **All extensions verified across Light and Dark themes.**
