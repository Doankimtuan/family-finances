# ViNha Component System — Motion & Micro-Interaction Specifications

## 1. Motion Principles

1. **Functional Purpose**: Motion in ViNha communicates spatial continuity, provides tactile tactile confirmation, and clarifies state transitions. It is NEVER decorative.
2. **Calm Precision**: Animations are swift, quiet, and dampened. Playful bouncing, elastic wobbles, and gamified particle bursts are strictly prohibited.
3. **Respect Reduced Motion**: Full support for users who have requested minimal motion via OS preferences.

---

## 2. Standard Transition Tokens

```css
:root {
  /* Durations */
  --vn-motion-instant: 100ms; /* Toggle checkmark, radio dot */
  --vn-motion-press: 120ms; /* Button scale feedback */
  --vn-motion-fast: 150ms; /* Dropdown open, accordion expand */
  --vn-motion-standard: 250ms; /* Sheet slide-up, tab underline slide */
  --vn-motion-slow: 350ms; /* Full-screen route transitions */

  /* Calibrated Easings */
  --vn-ease-standard: cubic-bezier(
    0.2,
    0,
    0,
    1
  ); /* Decelerate / Clean entrance */
  --vn-ease-out: cubic-bezier(0, 0, 0.2, 1); /* Linear-out */
  --vn-ease-in: cubic-bezier(0.4, 0, 1, 1); /* Accelerate / Quick exit */
}

/* Reduced Motion Mode */
@media (prefers-reduced-motion: reduce) {
  :root {
    --vn-motion-instant: 0ms !important;
    --vn-motion-press: 0ms !important;
    --vn-motion-fast: 0ms !important;
    --vn-motion-standard: 0ms !important;
    --vn-motion-slow: 0ms !important;
  }
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. Micro-Interactions by Component

### Button Press Feedback

- On `:active` / touchstart:
  - `transform: scale(0.98);`
  - Background darkens by 8%–10%.
  - Duration: 120ms standard ease.

### Bottom Sheet Entry & Exit

- Entry:
  - Slides vertically from `translateY(100%)` to `translateY(0%)`.
  - Duration: 250ms with `--vn-ease-standard`.
  - Scrim fades from `opacity: 0` to `opacity: 1` over 200ms.
- Dismiss:
  - Slides down to `translateY(100%)` over 200ms with `--vn-ease-in`.

### Dropdown Popover

- Expands from top with slight scale (`scale(0.98)` to `scale(1.0)`), 150ms duration.
- Chevron rotates 180° smoothly.

### Switch Toggle

- Thumb translates 20px horizontally across the track over 150ms with a slight elongation to 24px during mid-flight.
