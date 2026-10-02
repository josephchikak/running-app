# Running Coach UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the existing personal running coach into a cohesive black-and-orange Track Cockpit across every primary and active-workout screen without changing its authored training, offline, or local-data behavior.

**Architecture:** Preserve the existing React routes, `TrainingContext`, IndexedDB repository, workout controllers, and lazy-loading boundaries. Add one pure summary module plus small semantic presentation components, reshape each page around the approved hierarchy, then replace the current stylesheet with an intentional token-driven responsive system.

**Tech Stack:** React 19, TypeScript 6, React Router 7, CSS, Vitest, Testing Library, Vite PWA

**Spec:** `docs/superpowers/specs/2026-10-02-running-coach-ui-redesign-design.md`

## Global Constraints

- Keep Night `#070707`, Track `#11100F`, Warm graphite `#1A1714`, Chalk `#FFF7ED`, Muted chalk `#A9A099`, Signal orange `#FF6A00`, and Sprint orange `#FF3D00` as the complete functional palette.
- Preserve Manrope for interface text and Barlow Condensed for display and metric text.
- Add no product dependency, remote font, image host, analytics service, environment variable, or network request.
- Do not alter workout prescriptions, plan scheduling, persistence schemas, GPS filtering, speech behavior, backup format, or privacy behavior.
- Display only metrics traceable to the existing schedule and saved results; do not invent calories, recovery scores, heart rate, elevation, social activity, or map routes.
- Keep all interactive targets at least 44 by 44 CSS pixels, support iPhone safe areas, and prevent horizontal overflow at 320, 375, and 390 CSS pixels.
- Preserve React escaping, strict Zod validation for persisted/imported data, explicit destructive confirmation, and local-only storage.
- Follow Standard.js formatting: two spaces, single quotes, and no semicolons.

## Review Focus

- Empty enrollment and empty history must remain directive states and must not render fabricated zero-value dashboards; Task 2 and Task 3 pin these states.
- Mixed completed, stopped, skipped, and unrelated-week data must not inflate completed-session totals; Task 1 pins the aggregation boundary.
- Strength results with zero distance and results without `plannedDate` must render meaningful History values without invalid date text; Task 3 pins both cases.
- GPS or wake-lock unavailability and long workout instructions must remain readable without hiding primary controls; Task 5 preserves behavior and Task 6 verifies the layout.
- Narrow iPhones, safe-area insets, enlarged labels, confirmation controls, and the floating dock must not overflow or shrink below 44 pixels; Task 6 verifies these conditions.

---

### Task 1: Real-data training summaries

**Files:**
- Create: `src/domain/training-summary.ts`
- Create: `src/domain/training-summary.test.ts`

**Interfaces:**
- Consumes: `ScheduledWorkout[]` and `WorkoutResult[]` from `src/domain/models.ts`
- Produces: `TrainingSummary`, `summarizeResults(results)`, and `summarizeWeek(schedule, results, weekNumber)` for Today and History

- [ ] **Step 1: Write the failing selector tests**

```ts
import { describe, expect, it } from 'vitest'
import { scheduledWorkout, result } from '../storage/test-fixtures'
import { summarizeResults, summarizeWeek } from './training-summary'

describe('training summaries', () => {
  it('counts only completed results', () => {
    expect(summarizeResults([
      result,
      { ...result, id: 'result-stopped', status: 'stopped', durationSeconds: 300, distanceMetres: 500 }
    ])).toEqual({ sessions: 1, durationSeconds: 1800, distanceMetres: 4200 })
  })

  it('limits a weekly summary to scheduled workout ids in that week', () => {
    const otherSchedule = { ...scheduledWorkout, id: 'week-2-monday-2026-10-05', weekNumber: 2 }
    expect(summarizeWeek(
      [scheduledWorkout, otherSchedule],
      [result, { ...result, id: 'result-week-2', scheduledWorkoutId: otherSchedule.id }],
      1
    )).toEqual({ sessions: 1, durationSeconds: 1800, distanceMetres: 4200 })
  })
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- --run src/domain/training-summary.test.ts`

Expected: FAIL because `training-summary.ts` does not exist.

- [ ] **Step 3: Implement the pure selectors**

```ts
import type { ScheduledWorkout, WorkoutResult } from './models'

export interface TrainingSummary {
  sessions: number
  durationSeconds: number
  distanceMetres: number
}

export function summarizeResults (results: WorkoutResult[]): TrainingSummary {
  return results
    .filter(result => result.status === 'completed')
    .reduce((summary, result) => ({
      sessions: summary.sessions + 1,
      durationSeconds: summary.durationSeconds + result.durationSeconds,
      distanceMetres: summary.distanceMetres + result.distanceMetres
    }), { sessions: 0, durationSeconds: 0, distanceMetres: 0 })
}

export function summarizeWeek (
  schedule: ScheduledWorkout[],
  results: WorkoutResult[],
  weekNumber: number
): TrainingSummary {
  const scheduledIds = new Set(
    schedule.filter(entry => entry.weekNumber === weekNumber).map(entry => entry.id)
  )
  return summarizeResults(results.filter(result => scheduledIds.has(result.scheduledWorkoutId)))
}
```

- [ ] **Step 4: Verify GREEN and the complete suite**

Run: `npm test -- --run src/domain/training-summary.test.ts && npm test -- --run`

Expected: selector tests pass and all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/training-summary.ts src/domain/training-summary.test.ts
git commit -m 'feat: add real training summary selectors'
```

### Task 2: App shell and Today cockpit

**Files:**
- Create: `src/components/AppIcon.tsx`
- Create: `src/components/TrainingWeekStrip.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/features/today/TodayPage.tsx`
- Modify: `src/features/today/TodayPage.test.tsx`

**Interfaces:**
- Consumes: `summarizeWeek(schedule, results, weekNumber)` from Task 1 and existing `ScheduledWorkoutActions`
- Produces: `AppIcon`, `TrainingWeekStrip`, icon-and-label navigation, and the complete Today cockpit structure

- [ ] **Step 1: Add failing shell and Today behavior tests**

Extend `src/app/App.test.tsx`:

```ts
expect(screen.getByRole('link', { name: /today/i })).toHaveAttribute('aria-current', 'page')
```

Add to `src/features/today/TodayPage.test.tsx` with a stored week and completed result:

```ts
it('shows the current training week and real saved totals', async () => {
  const schedule = createStoredSchedule()
  await repository.saveEnrollment(enrollment)
  await repository.replaceSchedule(schedule)
  await repository.saveResult({
    ...result,
    scheduledWorkoutId: schedule[0].id,
    workoutId: schedule[0].workoutId ?? result.workoutId
  })

  renderWithTraining(<TodayPage />, {
    repository,
    now: new Date('2026-09-28T08:00:00+01:00')
  })

  expect(await screen.findByRole('list', { name: /training week/i })).toBeVisible()
  expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('1 session')
  expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('30 min')
  expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('4.20 km')
})
```

Also assert the existing no-enrollment state does not expose a `This week` region.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/app/App.test.tsx src/features/today/TodayPage.test.tsx`

Expected: FAIL because the current page has no accessible training-week list or weekly summary region.

- [ ] **Step 3: Implement navigation icons and week strip**

`AppIcon` exposes an inline `svg` with `aria-hidden='true'` for `today`, `plan`, `history`, and `settings`. `TrainingWeekStrip` accepts the current week entries and today string, renders a seven-item `ol aria-label='Training week'`, uses `aria-current='date'` on today, and includes visually hidden status text for completed, skipped, scheduled, and rest states.

Update `AppShell` navigation items to include icon names while preserving the visible labels and existing routes.

- [ ] **Step 4: Reshape Today around existing data**

Use `results` from `useTraining`, calculate `weeklySummary` with `summarizeWeek`, and render:

```tsx
<header className='today-header'>
  <p>{formatDisplayDate(today)}</p>
  {displayedEntry && <span>Week {displayedEntry.weekNumber} of 17</span>}
</header>
<section className='today-session' aria-labelledby='today-session-title'>
  {/* existing enrollment, session, rest, and status branches */}
</section>
{weeklySessions.length > 0 && <TrainingWeekStrip entries={weekSchedule} today={today} />}
{enrollment && displayedEntry && (
  <section aria-label='This week' className='weekly-summary'>
    <h2>This week</h2>
    <dl>{/* sessions, formatted minutes, formatted kilometres */}</dl>
  </section>
)}
```

Keep Today’s session dominant, keep Catch up below the weekly summary, and do not render summary analytics before enrollment.

- [ ] **Step 5: Verify GREEN and regressions**

Run: `npm test -- --run src/app/App.test.tsx src/features/today/TodayPage.test.tsx && npm test -- --run`

Expected: new semantic structure passes and all existing start/catch-up behavior remains green.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppIcon.tsx src/components/TrainingWeekStrip.tsx src/app/AppShell.tsx src/app/App.test.tsx src/features/today/TodayPage.tsx src/features/today/TodayPage.test.tsx
git commit -m 'feat: build the Today training cockpit'
```

### Task 3: Plan and History information hierarchy

**Files:**
- Modify: `src/features/plan/PlanPage.tsx`
- Modify: `src/features/plan/PlanPage.test.tsx`
- Modify: `src/features/history/HistoryPage.tsx`
- Modify: `src/features/history/HistoryPage.test.tsx`

**Interfaces:**
- Consumes: `summarizeResults(results)` from Task 1, existing plan catalog, and existing scheduled workout actions
- Produces: accessible plan-route chronology and real-data History summary

- [ ] **Step 1: Add failing Plan and History tests**

Add a Plan assertion that the expanded week is exposed as a labelled session list:

```ts
expect(screen.getByRole('list', { name: /week 1 sessions/i })).toBeVisible()
```

Add History tests for completed totals, stopped-result exclusion, missing `plannedDate`, and zero-distance strength:

```ts
expect(await screen.findByRole('region', { name: /history summary/i })).toHaveTextContent('1 session')
expect(screen.getByRole('region', { name: /history summary/i })).toHaveTextContent('30 min')
expect(screen.getByRole('region', { name: /history summary/i })).toHaveTextContent('4.20 km')
```

Save a stopped strength result without `plannedDate` and assert its row renders `0.00 km` and a valid completion date while the aggregate region still reflects only the completed run.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/features/plan/PlanPage.test.tsx src/features/history/HistoryPage.test.tsx`

Expected: FAIL because the labelled week list and History aggregate region do not exist.

- [ ] **Step 3: Implement the Plan route and History summary**

In Plan, keep the phase grouping and accordion behavior but add a route marker, status marker, `aria-expanded`, `aria-controls`, and `aria-label={`Week ${week.number} sessions`}` to the session list.

In History, call `summarizeResults(results)` and render its region only when `results.length > 0`:

```tsx
<section aria-label='History summary' className='history-summary'>
  <dl>
    <div><dt>Sessions</dt><dd>{summary.sessions}</dd></div>
    <div><dt>Time</dt><dd>{formatSummaryDuration(summary.durationSeconds)}</dd></div>
    <div><dt>Distance</dt><dd>{(summary.distanceMetres / 1000).toFixed(2)} km</dd></div>
  </dl>
</section>
```

Preserve every result row, including stopped and zero-distance strength sessions; only aggregates exclude stopped results.

- [ ] **Step 4: Verify GREEN and regressions**

Run: `npm test -- --run src/features/plan/PlanPage.test.tsx src/features/history/HistoryPage.test.tsx && npm test -- --run`

Expected: new hierarchy passes while start, skip, empty History, and planned-versus-actual behavior remain green.

- [ ] **Step 5: Commit**

```bash
git add src/features/plan/PlanPage.tsx src/features/plan/PlanPage.test.tsx src/features/history/HistoryPage.tsx src/features/history/HistoryPage.test.tsx
git commit -m 'feat: redesign plan and training history'
```

### Task 4: Settings control groups

**Files:**
- Modify: `src/features/settings/SettingsPage.tsx`
- Modify: `src/features/settings/SettingsPage.test.tsx`
- Modify: `src/components/InstallHelp.tsx`

**Interfaces:**
- Consumes: existing settings, backup, restore, erase, and install behavior
- Produces: semantic switch controls and grouped settings layout without changing persistence

- [ ] **Step 1: Add the failing accessibility test**

```ts
it('exposes cue preferences as switches', async () => {
  renderWithTraining(<SettingsPage />, { repository })

  expect(await screen.findByRole('switch', { name: /spoken cues/i })).toBeChecked()
  expect(screen.getByRole('switch', { name: /vibration fallback/i })).toBeChecked()
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/features/settings/SettingsPage.test.tsx`

Expected: FAIL because the checkboxes are not exposed as switches.

- [ ] **Step 3: Implement grouped settings and switches**

Add `role='switch'` to the existing controlled cue inputs, preserve their labels and handlers, and reshape the markup into Training, Backup, Install, About, and Erase groups. Keep the baseline help relation, file input restrictions, inline status message, and explicit erase confirmation unchanged.

- [ ] **Step 4: Verify GREEN and regressions**

Run: `npm test -- --run src/features/settings/SettingsPage.test.tsx && npm test -- --run`

Expected: switch semantics pass and update/erase behavior remains green.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/SettingsPage.tsx src/features/settings/SettingsPage.test.tsx src/components/InstallHelp.tsx
git commit -m 'feat: refine mobile settings controls'
```

### Task 5: Active run and strength cockpit

**Files:**
- Modify: `src/features/workout/WorkoutPage.tsx`
- Modify: `src/features/workout/WorkoutPage.test.tsx`
- Modify: `src/features/strength/StrengthPage.tsx`
- Modify: `src/features/strength/StrengthPage.test.tsx`
- Modify: `src/components/StepProgress.tsx`
- Modify: `src/components/WorkoutControls.tsx`

**Interfaces:**
- Consumes: existing run controller, GPS/wake-lock states, workout reducer, pace guidance, and completion callbacks
- Produces: consistent progress-lane markup and glanceable active-workout hierarchy

- [ ] **Step 1: Add failing active-workout structure tests**

For a new run, assert an accessible progressbar and a labelled live-metrics group:

```ts
expect(await screen.findByRole('progressbar', { name: /workout progress/i })).toHaveAttribute('aria-valuenow', '1')
expect(screen.getByRole('group', { name: /live run metrics/i })).toBeVisible()
```

For strength, retain the existing progressbar assertion and add:

```ts
expect(screen.getByRole('group', { name: /strength controls/i })).toBeVisible()
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- --run src/features/workout/WorkoutPage.test.tsx src/features/strength/StrengthPage.test.tsx`

Expected: FAIL because run progress and labelled control/metric groups do not exist.

- [ ] **Step 3: Implement consistent progress and control semantics**

Reuse `StepProgress` in the run player, label the run metrics `role='group' aria-label='Live run metrics'`, and label `WorkoutControls` with `role='group' aria-label='Strength controls'`. Reshape both players so capability status is first, current metric is dominant, supporting instruction follows, and controls stay at the bottom. Keep controller calls and completion persistence unchanged.

- [ ] **Step 4: Verify GREEN and regressions**

Run: `npm test -- --run src/features/workout/WorkoutPage.test.tsx src/features/strength/StrengthPage.test.tsx && npm test -- --run`

Expected: progress/control tests and all restore, finish, strength, GPS, speech, and wake-lock behavior pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/workout/WorkoutPage.tsx src/features/workout/WorkoutPage.test.tsx src/features/strength/StrengthPage.tsx src/features/strength/StrengthPage.test.tsx src/components/StepProgress.tsx src/components/WorkoutControls.tsx
git commit -m 'feat: redesign active workout players'
```

### Task 6: Track Cockpit styling and release verification

**Files:**
- Modify: `src/styles/index.css`
- Modify: `tasks/todo.md`

**Interfaces:**
- Consumes: semantic class structure produced by Tasks 2–5
- Produces: final black-and-orange responsive visual system across all screens

- [ ] **Step 1: Establish the final token and base layer**

Replace the root tokens with the approved palette and add shared tokens for content width, dock height, panel radii, borders, and safe-area spacing:

```css
:root {
  color: #fff7ed;
  background: #070707;
  --color-field: #070707;
  --color-track: #11100f;
  --color-surface: #1a1714;
  --color-text: #fff7ed;
  --color-muted: #a9a099;
  --color-action: #ff6a00;
  --color-hard: #ff3d00;
  --line: rgb(255 247 237 / 12%);
  --content-width: 42rem;
  --dock-height: 4.75rem;
}
```

Keep focus styles, safe areas, reduced motion, tabular metric figures, and a minimum 44-pixel target rule for interactive controls.

- [ ] **Step 2: Style the shell and content screens**

Implement the centered app frame, floating navigation dock, Today hero, orange progress lane, seven-day strip, real-data summary, catch-up rows, plan route, History summary/results, and grouped Settings surfaces. Use one dominant Today panel, smaller metric surfaces, and divider-led lists rather than a uniform card grid.

- [ ] **Step 3: Style active workout screens**

Implement full-height run and strength layouts with fixed visual hierarchy, oversized condensed metrics, orange progress lanes, quiet capability/status treatments, reachable controls, and safe-area padding. Ensure long instructions wrap and do not push primary controls off-screen without allowing vertical scrolling.

- [ ] **Step 4: Run automated release gates**

Run: `npm run lint && npm run typecheck && npm test -- --run && npm run build && git diff --check`

Expected: lint and typecheck pass, the full suite passes, Vite generates the PWA, and the diff has no whitespace errors.

- [ ] **Step 5: Run security gates**

Run: `npm audit --audit-level=high`

Expected: zero high-or-critical vulnerabilities.

Run: `rg -n --hidden -g '!node_modules/**' -g '!dist/**' -g '!.git/**' '(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' .`

Expected: no matches.

- [ ] **Step 6: Verify the application visually**

Run the production preview and inspect at 375 by 812, 390 by 844, 320-pixel width, and desktop. Verify Today enrollment and scheduled states, Plan expansion and skip confirmation, empty and populated History, Settings switches/messages, run player, strength player, safe areas, keyboard focus, no console errors, no horizontal overflow, and all primary/navigation targets at least 44 CSS pixels.

- [ ] **Step 7: Record the review and commit**

Mark Task 11 complete in `tasks/todo.md` only after every automated and visual gate passes. Add a Review entry with exact test counts, build result, security result, and viewport results.

```bash
git add src/styles/index.css tasks/todo.md
git commit -m 'feat: complete Track Cockpit redesign'
```
