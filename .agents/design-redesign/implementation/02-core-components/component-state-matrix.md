# Component State Matrix — Implementation 02

This matrix tracks the implementation and verification status for all canonical component states across the ViNha reusable UI layer.

## State Evaluation Criteria

- **PASS**: State implemented, visually verified in browser, and validated via automated unit tests.
- **N/A**: State is not part of this component's specification or interaction model.
- **FAIL**: State is required but missing or broken.

---

## State Matrix Table

| Component              | Default | Hover | Pressed | Focus | Selected | Loading | Error | Disabled | Read-only |  Status  |
| :--------------------- | :-----: | :---: | :-----: | :---: | :------: | :-----: | :---: | :------: | :-------: | :------: |
| **Button**             |  PASS   | PASS  |  PASS   | PASS  |   N/A    |  PASS   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **IconButton**         |  PASS   | PASS  |  PASS   | PASS  |   N/A    |  PASS   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **TextInput**          |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **PasswordInput**      |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |    N/A    | COMPLETE |
| **Textarea**           |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **NumberInput**        |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **CurrencyInput**      |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **QuantityInput**      |  PASS   | PASS  |  PASS   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **PercentageInput**    |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **Select (Closed)**    |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **Select (Dropdown)**  |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **SearchableSelect**   |  PASS   | PASS  |  PASS   | PASS  |   PASS   |  PASS   | PASS  |   PASS   |   PASS    | COMPLETE |
| **Checkbox**           |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   | PASS  |   PASS   |    N/A    | COMPLETE |
| **Radio / RadioGroup** |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   | PASS  |   PASS   |    N/A    | COMPLETE |
| **Switch**             |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **Tabs**               |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **SegmentedControl**   |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **FilterChip**         |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   |  N/A  |   PASS   |    N/A    | COMPLETE |
| **Badge**              |  PASS   |  N/A  |   N/A   |  N/A  |   N/A    |   N/A   |  N/A  |   N/A    |    N/A    | COMPLETE |
| **StatusBadge**        |  PASS   |  N/A  |   N/A   |  N/A  |   PASS   |   N/A   |  N/A  |   N/A    |    N/A    | COMPLETE |
| **SearchInput**        |  PASS   | PASS  |   N/A   | PASS  |   N/A    |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |
| **DateInput**          |  PASS   | PASS  |  PASS   | PASS  |   PASS   |   N/A   | PASS  |   PASS   |   PASS    | COMPLETE |

---

## State Quality Notes

1. **Hover ≠ Pressed**:
   - Every interactive control (Buttons, IconButtons, Chips, Tabs, Select items, Switches) clearly differentiates hover states (`hover:bg-*`, `hover:border-*`) from pressed states (`active:scale-[0.98]`, `active:scale-95`, `active:bg-*`).
   - Motion is automatically disabled when `prefers-reduced-motion` is active (`motion-reduce:active:transform-none`).

2. **Disabled ≠ Read-Only**:
   - `Disabled`: Opacity reduced to 45% (`opacity-45`), user interaction blocked (`pointer-events-none cursor-not-allowed`), keyboard focus blocked (`tabIndex={-1}`).
   - `Read-Only`: Opacity strictly preserved at 100% (`opacity-100`), background subtle (`bg-surface-subtle`), borders dashed (`border-dashed`), text selection allowed (`select-text`), keyboard focus preserved for accessibility.

3. **Loading Behavior**:
   - `Button` loading renders an inline spinner (`Spinner`), disables click repeat, preserves exact button height and width, and marks `isPending` / `data-loading="true"`.

4. **Error Architecture**:
   - Form inputs coordinate via `FormField` or inline `hasError`, applying `border-debt`, accessible error description IDs, and displaying error text below the control.
