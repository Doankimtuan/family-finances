# Accessibility Guidelines

## Baseline

ViNha must meet WCAG AA for all product UI.

## Mobile

- Minimum touch target: 44px.
- Bottom actions and navigation must respect safe areas.
- Keyboard must not hide active fields or submit actions.
- Scroll position must be preserved when returning from detail and review flows.

## Text And Contrast

- Body text and control labels meet AA contrast.
- Placeholder text is never the only label.
- Disabled states are visually disabled but still understandable.
- Warning text is not color-only.

## Financial Meaning

Screen reader labels must include financial meaning:

- "available balance"
- "estimated value, not cash"
- "amount due"
- "real money changed"
- "plan unchanged"

## Forms

- Labels appear above inputs.
- Errors appear below fields.
- Validation summary links or moves focus to the first invalid field when needed.
- Required and optional states are explicit.

## Feedback

- Loading does not imply success.
- Success receipts announce outcomes.
- Toasts are polite unless urgent.
- Critical errors identify recovery path.

## Motion

Respect `prefers-reduced-motion`. Do not animate sensitive error states or money values.

## Localization

English and Vietnamese must fit without clipping. Avoid fixed-width text containers for labels and buttons. Amount and date formatting uses shared localization utilities.

