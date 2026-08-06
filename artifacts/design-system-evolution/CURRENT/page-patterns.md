# Page Patterns

## OverviewPage

- Hierarchy: page title, one dominant orientation summary, next actions, secondary summaries.
- Required regions: TopAppBar, primary summary, priority action group, recent or relevant facts.
- Primary action position: top bar for short screens, bottom action for capture-heavy screens.
- Secondary behavior: grouped below primary context.
- Loading: skeleton preserves summary and row shapes.
- Empty: show first valid setup action.
- Error: preserve known cached facts if available.
- Mobile: one column, no dashboard grid.

## ListPage

- Hierarchy: title, optional filter/search, rows, list state.
- Required regions: TopAppBar, list controls, content list, empty/error/loading.
- Primary action position: top bar or FloatingAction when capture/add is frequent.
- Secondary behavior: row actions use menu or detail entry.
- Loading: row skeletons.
- Empty: owner-specific explanation and one next action.
- Error: retry and safe route out.
- Mobile: preserve scroll position and thumb targets.

## DetailPage

- Hierarchy: object identity, key fact, status/source, sections, actions.
- Required regions: TopAppBar with back, summary, facts, history/schedule, actions.
- Primary action position: top bar for one simple action, bottom for consequential action.
- Secondary behavior: overflow menu or grouped action rows.
- Loading: summary skeleton and row skeletons.
- Empty: section-specific only, not whole-page unless object missing.
- Error: route to owner parent when object cannot load.
- Mobile: no split desktop panels inside viewport.

## CreateFlow

- Hierarchy: one question at a time for complex financial products.
- Required regions: progress, current step, preview, bottom action.
- Primary action position: sticky bottom action.
- Secondary behavior: back/cancel, draft only when safe.
- Loading: preserve form shell, disable unsafe submit.
- Empty: not applicable.
- Error: inline field errors plus summary.
- Mobile: keyboard must not hide active field or action.

## EditFlow

- Hierarchy: current value, editable field, impact preview when relevant.
- Required regions: object context, fields, validation, action.
- Primary action position: bottom action for long edits.
- Secondary behavior: cancel returns to object detail.
- Loading: existing values skeleton.
- Empty: not applicable.
- Error: preserve edits when possible.
- Mobile: dirty-exit protection only after meaningful edits.

## ReviewFlow

- Hierarchy: decision question, evidence, consequence, decision actions.
- Required regions: item type, source facts, recommendation if allowed, actions.
- Primary action position: bottom action or paired decision row.
- Secondary behavior: defer, route to source, dismiss only if valid.
- Loading: evidence skeleton.
- Empty: no decisions needed.
- Error: retry and return to queue.
- Mobile: return to queue position after decision.

## ConfirmationFlow

- Hierarchy: what happens, source/destination/amount/date, reversibility, affected records.
- Required regions: preview, risk/caution if needed, confirm action, cancel.
- Primary action position: bottom action.
- Secondary behavior: cancel/back keeps context.
- Loading: lock controls while committing.
- Empty: not applicable.
- Error: show what failed and what remained unchanged.
- Mobile: sheet for short confirmations, page for complex consequences.

## TimelinePage

- Hierarchy: time period, important upcoming or past events, grouped detail.
- Required regions: time control, timeline/list, state labels.
- Primary action position: contextual add if owner allows.
- Secondary behavior: filter or jump controls.
- Loading: dated row skeletons.
- Empty: explain no events in period.
- Error: preserve current period.
- Mobile: vertical timeline or grouped rows.

## SchedulePage

- Hierarchy: upcoming obligations first, then completed or later items.
- Required regions: schedule header, upcoming rows, source/freshness, actions.
- Primary action position: owner-specific add or review action.
- Secondary behavior: filters are compact.
- Loading: schedule skeleton.
- Empty: one action or no-pressure message.
- Error: retry and owner route.
- Mobile: date labels must remain visible.

## SettingsPage

- Hierarchy: identity, grouped preferences, account lifecycle last.
- Required regions: profile/household context, settings groups, dangerous actions.
- Primary action position: inline for harmless toggles, bottom for dirty forms.
- Secondary behavior: destructive actions separated.
- Loading: group skeletons.
- Empty: not applicable.
- Error: recover in place.
- Mobile: no dense two-column settings.

## EmptyFirstUsePage

- Hierarchy: supportive heading, why empty, one next action, optional secondary learn path.
- Required regions: icon/illustration if helpful, copy, action.
- Primary action position: centered within thumb reach or bottom if flow begins.
- Secondary behavior: skip or later only when business allows.
- Loading: not applicable.
- Empty: this is the state.
- Error: not applicable.
- Mobile: concise, no marketing hero.

