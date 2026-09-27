# ViNha Component System — Component Usage Rules & Anti-Patterns

## 1. Golden Rules of ViNha UI

1. **Same Semantic Purpose = Same Component**: Never invent a one-off component when an approved design system primitive exists.
2. **Never Color Alone**: Always couple color cues with explicit text, signed numbers (`+`, `−`, `⇄`), or unambiguous icons.
3. **Vietnamese Language Respect**: Never compromise line-heights or truncate diacritics. Always test with long Vietnamese text strings.
4. **Financial Invariance**: Non-banking actions (allocating jars, setting policies) must explicitly reassure the user that bank balances remain untouched.

---

## 2. Component Do's & Don'ts

### A. Buttons & Actions

- ✅ **DO**: Use a single Primary Button per visible view or action sheet.
- ✅ **DO**: Use Destructive Button strictly for irreversible actions (e.g. _Xoá đối tác_, _Tất toán nợ_, _Xoá tài khoản_).
- ❌ **DON'T**: Use Destructive red for regular daily expense entries or safe "Huỷ bỏ" (Cancel) actions.
- ❌ **DON'T**: Stack two primary filled buttons beside each other at equal visual weight.

### B. Currency & Numeric Inputs

- ✅ **DO**: Format Vietnamese Dong (VND) with strict thousand separators (`₫ 25.000.000`) and tabular numerals (`tnum`).
- ✅ **DO**: Provide real-time Vietnamese spoken text (_"Hai mươi lăm triệu đồng"_) below large monetary inputs.
- ❌ **DON'T**: Allow fractional decimals or cents for VND values.
- ❌ **DON'T**: Truncate numbers with ellipsis (`...`) inside active input fields.

### C. Selects & Dropdowns

- ✅ **DO**: Support both closed resting state AND open option list overlay.
- ✅ **DO**: Switch to Searchable Select or full Bottom Sheet when option count exceeds 8 items.
- ❌ **DON'T**: Allow dropdown popovers to overflow the viewport or get hidden behind sticky navigation bars.
- ❌ **DON'T**: Use native `<select>` dropdowns as primary product controls on mobile.

### D. Switches vs. Checkboxes

- ✅ **DO**: Use `<Switch>` ONLY for instant-effect settings (e.g. Dark Mode, Biometric login).
- ❌ **DON'T**: Use `<Switch>` inside forms that require the user to press "Lưu" (Save) or "Xác nhận" (Confirm). Use Checkbox instead.
- ❌ **DON'T**: Use `<Checkbox>` for mutually exclusive single-choice decisions (Use Radio or Segmented Control).

### E. Status Badges & Pills

- ✅ **DO**: Ensure every badge includes clear Vietnamese text alongside its semantic background tint.
- ❌ **DON'T**: Use generic rainbow colors that do not map to the approved financial token system.
- ❌ **DON'T**: Rely on a bare colored dot without accompanying text to communicate critical account states.

### F. Progress Bars & Jars

- ✅ **DO**: Visually clamp the progress bar fill at 100% when overspent, accompanied by explicit text: _"Vượt ₫ 809.244 (108%)"_.
- ❌ **DON'T**: Let progress bar fills exceed 100% width and break out of card boundaries.
- ❌ **DON'T**: Show an unlabelled progress bar without explaining the numerator and denominator (`Đã chi / Ngân sách`).

### G. Bottom Sheets vs. Modal Dialogs

- ✅ **DO**: Use Bottom Sheets for complex forms, filter sets, and creation flows on mobile.
- ✅ **DO**: Reserve Modal Dialogs strictly for high-impact, destructive confirmations.
- ❌ **DON'T**: Put multi-field forms or dense table rosters inside centered modal dialogs on mobile.
