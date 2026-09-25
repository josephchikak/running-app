# Personal Running Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, offline-first iPhone PWA that schedules preset 5K/10K and strength plans, guides each workout with spoken cues, tracks foreground GPS distance, and stores history locally.

**Architecture:** A React/Vite client keeps immutable, versioned plans separate from pure scheduling and workout state machines. Browser capabilities and IndexedDB sit behind small adapters so domain behavior is testable without a phone, while the mobile UI consumes those interfaces through focused feature modules.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, React Router hash routing, Zod, idb, vite-plugin-pwa, Vitest, React Testing Library, fake-indexeddb, Playwright

**Spec:** `docs/superpowers/specs/2026-09-25-personal-running-coach-design.md`

## Global Constraints

- Primary device is iPhone and distribution is an HTTPS PWA installed from Safari.
- GPS is foreground-only; active runs request a screen wake lock and visibly warn when tracking may pause.
- All mutable data is local-first; there is no login, cloud database, automatic sync, or third-party analytics.
- Raw GPS coordinates exist only during an active run and are discarded after summary metrics are created.
- Spoken prompts are primary; visible text plus tones/vibration are required fallbacks.
- Pace guidance always includes an effort cue, and effort wins when conditions or GPS make pace unreliable.
- Plans are authored and versioned; no AI generation or automatic difficulty increases.
- Code uses 2-space indentation, single quotes, strict equality, no semicolons, functional patterns, and no unused variables.
- Hooks remain top-level, effects clean up every browser subscription, and pure/expensive UI is memoized only when measurement or stable inputs justify it.
- Every task follows red-green-refactor and ends with an independently reviewable commit.

---

## File Map

```text
.
├── index.html                         # document metadata and PWA entry
├── package.json                       # scripts and dependencies
├── vite.config.ts                     # React, test, aliases, and PWA config
├── playwright.config.ts               # mobile browser verification
├── public/
│   ├── icons/                         # install icons and maskable icon
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── maskable-512.png
│   │   └── apple-touch-icon.png
│   ├── favicon.svg
│   ├── og-running-coach.svg           # social preview source
│   ├── robots.txt                     # noindex policy for personal app
│   └── sitemap.xml                    # stable public routes
├── src/
│   ├── app/
│   │   ├── App.tsx                    # providers and hash router
│   │   ├── AppShell.tsx               # mobile shell and bottom navigation
│   │   └── routes.tsx                 # route definitions and not-found page
│   ├── domain/
│   │   ├── models.ts                  # shared plan/session/result schemas and types
│   │   ├── pace.ts                    # deterministic pace zones and formatting
│   │   ├── schedule.ts                # plan calendar expansion and status rules
│   │   └── workout-engine.ts          # pure step state machine
│   ├── data/plans/
│   │   ├── exercises.ts               # bodyweight and band exercise catalog
│   │   ├── faster-5k.ts               # eight-week 5K plan
│   │   ├── transition.ts              # one recovery week
│   │   ├── build-to-10k.ts            # eight-week 10K plan
│   │   └── catalog.ts                 # validated, versioned public catalog
│   ├── storage/
│   │   ├── database.ts                # IndexedDB schema and repositories
│   │   └── backup.ts                  # versioned export/import validation
│   ├── capabilities/
│   │   ├── gps.ts                     # geolocation watch and filtering
│   │   ├── speech.ts                  # queued speech and fallback events
│   │   └── wake-lock.ts               # acquire/reacquire/release behavior
│   ├── features/
│   │   ├── today/TodayPage.tsx         # next action and weekly progress
│   │   ├── plan/PlanPage.tsx           # 17-week calendar and session details
│   │   ├── workout/WorkoutPage.tsx     # active run composition
│   │   ├── workout/useActiveRun.ts     # engine/capability/persistence orchestration
│   │   ├── strength/StrengthPage.tsx   # guided strength timer
│   │   ├── history/HistoryPage.tsx     # completed summaries
│   │   ├── settings/SettingsPage.tsx   # cues, baseline, backup, and erasure
│   │   ├── onboarding/SetupCompletePage.tsx # post-enrollment thank-you state
│   │   └── legal/LegalPages.tsx        # privacy and terms
│   ├── components/                     # focused reusable controls and states
│   ├── styles/index.css                # tokens, reset, safe-area, and utilities
│   └── main.tsx                        # client entry
├── tests/e2e/                          # iPhone-sized acceptance flows
└── tasks/
    ├── todo.md                         # live execution checklist and review
    └── lessons.md                      # corrections and prevention rules
```

## Task 1: Tested PWA Foundation and Mobile Shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/AppShell.tsx`, `src/app/routes.tsx`, `src/styles/index.css`
- Create: `src/app/App.test.tsx`, `src/test/setup.ts`

**Interfaces:**
- Consumes: none
- Produces: `App`, `AppShell`, route IDs `today`, `plan`, `history`, `settings`, and `not-found`

- [ ] **Step 1: Write the shell test before the shell**

```tsx
it('opens on Today and exposes mobile navigation', () => {
  render(<App />)

  expect(screen.getByRole('heading', { name: /today/i })).toBeVisible()
  expect(screen.getByRole('navigation', { name: /primary/i })).toBeVisible()
  expect(screen.getByRole('link', { name: /plan/i })).toBeVisible()
})
```

- [ ] **Step 2: Run the test and confirm the missing app fails**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because `App` and the test environment do not exist.

- [ ] **Step 3: Add the minimum Vite/React/TypeScript project and mobile shell**

Use a hash router so static hosting needs no server rewrite. The initial Today route renders a skeleton page with a single above-the-fold Start action, and the bottom navigation applies iPhone safe-area insets.

```tsx
export function App () {
  return <RouterProvider router={router} />
}

export function AppShell () {
  return (
    <div className='app-shell'>
      <main><Outlet /></main>
      <PrimaryNavigation />
    </div>
  )
}
```

- [ ] **Step 4: Run foundation checks**

Run: `npm test -- src/app/App.test.tsx && npm run typecheck && npm run build`

Expected: all commands exit 0 and `dist/index.html` exists.

- [ ] **Step 5: Commit the tested foundation**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts index.html src
git commit -m 'feat: establish mobile PWA foundation'
```

## Task 2: Domain Models, Validation, and Pace Guidance

**Files:**
- Create: `src/domain/models.ts`, `src/domain/models.test.ts`
- Create: `src/domain/pace.ts`, `src/domain/pace.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `PlanTemplateSchema`, `WorkoutTemplateSchema`, `BackupSchema`, `PlanTemplate`, `WorkoutStep`, `WorkoutResult`, `getPaceGuidance(fiveKilometreSeconds, intensity)`, `formatPace(secondsPerKilometre)`

- [ ] **Step 1: Write schema and pace tests**

```ts
it('rejects a run step without a completion rule', () => {
  expect(() => WorkoutStepSchema.parse({ kind: 'run', instruction: 'Easy' })).toThrow()
})

it('uses the 30-minute baseline for controlled 5K guidance', () => {
  expect(getPaceGuidance(1800, 'five-k')).toEqual({
    minimumSecondsPerKilometre: 354,
    maximumSecondsPerKilometre: 366,
    effort: 'Hard but controlled'
  })
})
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npm test -- src/domain/models.test.ts src/domain/pace.test.ts`

Expected: FAIL because the schemas and functions are missing.

- [ ] **Step 3: Implement discriminated schemas and deterministic pace bands**

Model time, distance, repetition, run, recovery, and exercise steps as discriminated unions. Keep the baseline input configurable and round displayed pace without mutating plan templates.

```ts
export type Intensity = 'recovery' | 'easy' | 'steady' | 'threshold' | 'five-k' | 'stride'

export function getPaceGuidance (
  fiveKilometreSeconds: number,
  intensity: Intensity
): PaceGuidance {
  const baselinePace = fiveKilometreSeconds / 5
  const multiplier = paceMultipliers[intensity]

  return {
    minimumSecondsPerKilometre: Math.round(baselinePace * multiplier.minimum),
    maximumSecondsPerKilometre: Math.round(baselinePace * multiplier.maximum),
    effort: effortLabels[intensity]
  }
}
```

- [ ] **Step 4: Verify schemas and pace math**

Run: `npm test -- src/domain/models.test.ts src/domain/pace.test.ts && npm run typecheck`

Expected: all tests pass with no TypeScript errors.

- [ ] **Step 5: Commit the domain contract**

```bash
git add src/domain
git commit -m 'feat: define training domain and pace guidance'
```

## Task 3: Authored Plans and Calendar Scheduling

**Files:**
- Create: `src/data/plans/exercises.ts`, `src/data/plans/faster-5k.ts`, `src/data/plans/transition.ts`, `src/data/plans/build-to-10k.ts`, `src/data/plans/catalog.ts`
- Create: `src/data/plans/catalog.test.ts`
- Create: `src/domain/schedule.ts`, `src/domain/schedule.test.ts`

**Interfaces:**
- Consumes: `PlanTemplate`, `WorkoutTemplate`, `PlanTemplateSchema`, `getPaceGuidance`
- Produces: `trainingCatalog`, `expandPlanSchedule(plan, startDate)`, `getTodayEntry(schedule, date)`, `getWeeklyProgress(schedule, date)`

- [ ] **Step 1: Write catalog and weekday-placement tests**

```ts
it('contains seventeen valid weeks in the required order', () => {
  expect(trainingCatalog.weeks).toHaveLength(17)
  expect(trainingCatalog.weeks[0].phase).toBe('faster-5k')
  expect(trainingCatalog.weeks[8].phase).toBe('transition')
  expect(trainingCatalog.weeks[16].phase).toBe('build-to-10k')
})

it('places runs and strength on the agreed weekdays', () => {
  const schedule = expandPlanSchedule(trainingCatalog, new Date('2026-09-28T12:00:00+01:00'))
  expect(schedule.slice(0, 7).map(entry => entry.kind)).toEqual([
    'easy-run', 'strength-a', 'quality-run', 'strength-b', 'short-easy', 'long-run', 'rest'
  ])
})
```

- [ ] **Step 2: Run tests and confirm missing catalog/scheduler failures**

Run: `npm test -- src/data/plans/catalog.test.ts src/domain/schedule.test.ts`

Expected: FAIL because the catalog and scheduler do not exist.

- [ ] **Step 3: Author and validate all seventeen weeks**

Every run includes warm-up, main work, and cool-down. Tuesday and Thursday strength sessions use the shared exercise catalog, include an easier variation, and need no equipment beyond an optional band. The scheduler uses local calendar dates and the fixed Monday-through-Sunday rhythm.

```ts
export const trainingCatalog = PlanTemplateSchema.parse({
  id: 'personal-5k-to-10k',
  version: 1,
  title: '5K speed to 10K strength',
  weeks: [...fasterFiveKilometreWeeks, transitionWeek, ...buildToTenKilometreWeeks]
})
```

- [ ] **Step 4: Verify every plan reference and date**

Run: `npm test -- src/data/plans/catalog.test.ts src/domain/schedule.test.ts && npm run typecheck`

Expected: all plan schemas parse, all workout IDs resolve, and weekday tests pass.

- [ ] **Step 5: Commit the authored training system**

```bash
git add src/data src/domain/schedule.ts src/domain/schedule.test.ts
git commit -m 'feat: add 5k to 10k training catalog'
```

## Task 4: Pure Workout Engine and Guided Strength Player

**Files:**
- Create: `src/domain/workout-engine.ts`, `src/domain/workout-engine.test.ts`
- Create: `src/features/strength/StrengthPage.tsx`, `src/features/strength/StrengthPage.test.tsx`
- Create: `src/components/WorkoutControls.tsx`, `src/components/StepProgress.tsx`

**Interfaces:**
- Consumes: `WorkoutTemplate`, `WorkoutStep`
- Produces: `createWorkoutState(workout)`, `reduceWorkout(state, event)`, `getStepRemaining(state)`, `StrengthPage`

- [ ] **Step 1: Write state-transition and strength-flow tests**

```ts
it('advances a timed step exactly once', () => {
  const state = createWorkoutState(timedWorkout)
  const next = reduceWorkout(state, { type: 'TICK', elapsedSeconds: 30 })

  expect(next.currentStepIndex).toBe(1)
  expect(next.events).toContainEqual({ type: 'STEP_CHANGED', stepIndex: 1 })
})

it('pauses a strength countdown without consuming time', () => {
  vi.useFakeTimers()
  render(<StrengthPage workout={strengthWorkout} />)
  fireEvent.click(screen.getByRole('button', { name: /pause/i }))
  vi.advanceTimersByTime(5000)
  expect(screen.getByText('00:30')).toBeVisible()
})
```

- [ ] **Step 2: Confirm tests fail for missing behavior**

Run: `npm test -- src/domain/workout-engine.test.ts src/features/strength/StrengthPage.test.tsx`

Expected: FAIL because the engine and player are absent.

- [ ] **Step 3: Implement the reducer and accessible strength controls**

The reducer accepts `START`, `TICK`, `DISTANCE`, `PAUSE`, `RESUME`, `SKIP`, `PREVIOUS`, and `FINISH`. It derives completion from events and never reads the system clock internally.

```ts
export function reduceWorkout (state: WorkoutState, event: WorkoutEvent): WorkoutState {
  if (state.status === 'completed') return state
  if (event.type === 'PAUSE') return { ...state, status: 'paused' }
  if (event.type === 'RESUME') return { ...state, status: 'active' }

  return advanceEligibleSteps(applyWorkoutEvent(state, event))
}
```

- [ ] **Step 4: Verify engine and strength player**

Run: `npm test -- src/domain/workout-engine.test.ts src/features/strength/StrengthPage.test.tsx && npm run typecheck`

Expected: pause, resume, repetition, rest, skip, and finish cases pass.

- [ ] **Step 5: Commit the first complete workout experience**

```bash
git add src/domain/workout-engine* src/features/strength src/components
git commit -m 'feat: add guided strength workout player'
```

## Task 5: IndexedDB, Recovery, and Backup

**Files:**
- Create: `src/storage/database.ts`, `src/storage/database.test.ts`
- Create: `src/storage/backup.ts`, `src/storage/backup.test.ts`

**Interfaces:**
- Consumes: `PlanEnrollment`, `ActiveSession`, `WorkoutResult`, `UserSettings`, `BackupSchema`
- Produces: `trainingRepository`, `exportBackup(repository)`, `importBackup(repository, json)`

- [ ] **Step 1: Write persistence, restore, and atomic-import tests**

```ts
it('restores the most recent active-session checkpoint', async () => {
  await repository.saveActiveSession(activeSession)
  await expect(repository.getActiveSession()).resolves.toEqual(activeSession)
})

it('does not replace data when an import is invalid', async () => {
  await repository.saveSettings(settings)
  await expect(importBackup(repository, '{"schemaVersion":99}')).rejects.toThrow()
  await expect(repository.getSettings()).resolves.toEqual(settings)
})
```

- [ ] **Step 2: Run storage tests against fake IndexedDB**

Run: `npm test -- src/storage/database.test.ts src/storage/backup.test.ts`

Expected: FAIL because repository methods are missing.

- [ ] **Step 3: Implement versioned stores and transactional import**

Use stores for settings, enrollment, schedule state, active session, results, and local analytics counters. Import validates the whole payload before one read-write transaction replaces data.

```ts
export async function importBackup (repository: TrainingRepository, json: string) {
  const backup = BackupSchema.parse(JSON.parse(json))
  await repository.replaceFromBackup(backup)
}
```

- [ ] **Step 4: Verify persistence and migration boundaries**

Run: `npm test -- src/storage && npm run typecheck`

Expected: all stores restore, invalid backups preserve existing data, and raw GPS points never enter completed results.

- [ ] **Step 5: Commit local-first persistence**

```bash
git add src/storage src/domain/models.ts
git commit -m 'feat: persist and back up local training data'
```

## Task 6: Today, Plan, History, and Settings Screens

**Files:**
- Create: `src/features/today/TodayPage.tsx`, `src/features/today/TodayPage.test.tsx`
- Create: `src/features/plan/PlanPage.tsx`, `src/features/plan/PlanPage.test.tsx`
- Create: `src/features/history/HistoryPage.tsx`, `src/features/history/HistoryPage.test.tsx`
- Create: `src/features/settings/SettingsPage.tsx`, `src/features/settings/SettingsPage.test.tsx`
- Create: `src/features/onboarding/SetupCompletePage.tsx`, `src/features/onboarding/SetupCompletePage.test.tsx`
- Modify: `src/app/routes.tsx`, `src/app/AppShell.tsx`

**Interfaces:**
- Consumes: `trainingCatalog`, scheduler functions, `trainingRepository`, backup functions
- Produces: complete non-running navigation and plan enrollment flow

- [ ] **Step 1: Write user-flow tests**

```tsx
it('starts the plan and presents the Monday workout', async () => {
  renderApp({ now: '2026-09-28T08:00:00+01:00' })
  await user.click(screen.getByRole('button', { name: /start plan/i }))
  expect(await screen.findByText(/easy run/i)).toBeVisible()
  expect(screen.getByRole('button', { name: /start workout/i })).toBeVisible()
})
```

- [ ] **Step 2: Confirm the routes fail before implementation**

Run: `npm test -- src/features/today src/features/plan src/features/history src/features/settings`

Expected: FAIL because feature screens do not exist.

- [ ] **Step 3: Implement the screens and explicit empty/error states**

The Today primary action stays above the fold. The current week expands by default, History shows summaries without maps, and Settings exposes baseline, cues, backup, restore, and erase confirmation. Successful enrollment routes through a concise setup-complete thank-you screen before Today.

- [ ] **Step 4: Verify feature flows and production build**

Run: `npm test -- src/features && npm run typecheck && npm run build`

Expected: all screen tests pass and navigation produces no console errors.

- [ ] **Step 5: Commit the plan-management UI**

```bash
git add src/features src/app
git commit -m 'feat: add training plan and history screens'
```

## Task 7: GPS Filtering and Live Run Metrics

**Files:**
- Create: `src/capabilities/gps.ts`, `src/capabilities/gps.test.ts`
- Create: `src/features/workout/run-metrics.ts`, `src/features/workout/run-metrics.test.ts`

**Interfaces:**
- Consumes: browser `GeolocationPosition`
- Produces: `createGpsTracker(options)`, `filterGpsSample(previous, sample)`, `calculateDistanceMetres(a, b)`, `calculateRollingPace(samples, windowSeconds)`

- [ ] **Step 1: Write deterministic route, accuracy, and spike tests**

```ts
it('rejects an inaccurate point without adding distance', () => {
  const result = filterGpsSample(goodPoint, { ...nextPoint, accuracy: 80 })
  expect(result).toEqual({ accepted: false, reason: 'poor-accuracy' })
})

it('calculates a known one-kilometre route within tolerance', () => {
  expect(calculateTrackDistance(oneKilometreFixture)).toBeCloseTo(1000, -1)
})
```

- [ ] **Step 2: Run GPS tests and confirm failures**

Run: `npm test -- src/capabilities/gps.test.ts src/features/workout/run-metrics.test.ts`

Expected: FAIL because filters and metric functions are missing.

- [ ] **Step 3: Implement high-accuracy tracking behind an adapter**

Use named constants for maximum accepted accuracy, minimum movement, maximum plausible speed, stale-sample age, and rolling-pace window. `stop()` always clears the browser watch.

```ts
export interface GpsTracker {
  start: (listener: GpsListener) => Promise<void>
  stop: () => void
  getStatus: () => GpsStatus
}
```

- [ ] **Step 4: Verify filtering and cleanup**

Run: `npm test -- src/capabilities/gps.test.ts src/features/workout/run-metrics.test.ts && npm run typecheck`

Expected: known distance, weak signal, implausible speed, stale data, and cleanup tests pass.

- [ ] **Step 5: Commit the run-tracking core**

```bash
git add src/capabilities/gps* src/features/workout/run-metrics*
git commit -m 'feat: add filtered gps run metrics'
```

## Task 8: Speech, Wake Lock, and Active Run Orchestration

**Files:**
- Create: `src/capabilities/speech.ts`, `src/capabilities/speech.test.ts`
- Create: `src/capabilities/wake-lock.ts`, `src/capabilities/wake-lock.test.ts`
- Create: `src/features/workout/useActiveRun.ts`, `src/features/workout/useActiveRun.test.tsx`
- Create: `src/features/workout/WorkoutPage.tsx`, `src/features/workout/WorkoutPage.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Consumes: workout engine, GPS tracker, repository, browser speech/wake/vibration capabilities
- Produces: `createSpeechCuePlayer()`, `createWakeLockController()`, `useActiveRun(workout)`, complete active-run UI

- [ ] **Step 1: Write cue-queue, wake reacquisition, and run-flow tests**

```ts
it('does not overlap spoken cues', async () => {
  const player = createSpeechCuePlayer(speechSynthesisMock)
  player.enqueue('Run hard for two minutes')
  player.enqueue('One minute remaining')
  expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1)
  speechSynthesisMock.finishCurrent()
  expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(2)
})

it('restores an interrupted run from its checkpoint', async () => {
  await repository.saveActiveSession(activeRunCheckpoint)
  render(<WorkoutPage workout={intervalWorkout} />)
  await user.click(screen.getByRole('button', { name: /resume/i }))
  expect(screen.getByText(/interval 3 of 6/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the active-run tests and confirm failures**

Run: `npm test -- src/capabilities/speech.test.ts src/capabilities/wake-lock.test.ts src/features/workout`

Expected: FAIL because cue, lock, and run orchestration are absent.

- [ ] **Step 3: Compose adapters without hiding fallbacks**

The Start gesture primes speech, requests location, requests wake lock, and then starts the engine. Weak GPS keeps time-based steps running. Capability status is always visible; speech failure emits a fallback event for tone/vibration and on-screen copy.

```ts
export interface ActiveRunController {
  state: WorkoutState
  metrics: RunMetrics
  capabilityStatus: CapabilityStatus
  pause: () => void
  resume: () => void
  finish: () => Promise<void>
}
```

- [ ] **Step 4: Verify the complete mocked run lifecycle**

Run: `npm test -- src/capabilities src/features/workout && npm run typecheck && npm run build`

Expected: start, permission denial, GPS loss/recovery, pause, refresh restore, cue fallback, finish, and coordinate discard tests pass.

- [ ] **Step 5: Commit the guided running experience**

```bash
git add src/capabilities src/features/workout src/app/routes.tsx
git commit -m 'feat: add spoken gps-guided running workouts'
```

## Task 9: Installability, Offline Operation, Legal Surfaces, and Release Verification

**Files:**
- Modify: `vite.config.ts`, `index.html`, `src/styles/index.css`, `src/app/routes.tsx`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `public/icons/apple-touch-icon.png`
- Create: `public/favicon.svg`, `public/og-running-coach.svg`, `public/robots.txt`, `public/sitemap.xml`
- Create: `src/components/InstallHelp.tsx`, `src/components/StorageNotice.tsx`, `src/components/ErrorBoundary.tsx`
- Create: `src/features/legal/LegalPages.tsx`, `src/features/legal/LegalPages.test.tsx`
- Create: `playwright.config.ts`, `tests/e2e/install-offline.spec.ts`, `tests/e2e/workout-flow.spec.ts`
- Modify: `tasks/todo.md`

**Interfaces:**
- Consumes: entire app
- Produces: installable/offline release candidate and recorded verification evidence

- [ ] **Step 1: Write install/offline and legal acceptance tests**

```ts
test('starts and completes a cached strength workout offline', async ({ page, context }) => {
  await page.goto('/#/')
  await page.getByRole('button', { name: /start plan/i }).click()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /today/i })).toBeVisible()
})
```

Also assert manifest metadata, icons, meta title/description, Open Graph image, favicon, custom not-found screen, privacy, terms, storage notice, accessible alt text, mobile breakpoints, sticky active-workout CTA, and explicit loading/form-error states.

- [ ] **Step 2: Run acceptance tests and confirm missing release assets fail**

Run: `npm run build && npm run test:e2e`

Expected: FAIL for missing manifest/offline cache/assets/legal surfaces.

- [ ] **Step 3: Add release surfaces and privacy-preserving local analytics**

Configure the PWA manifest and Workbox precache. Set `robots.txt` to disallow indexing because the app is personal. Record only local counters such as workout starts/completions; never transmit analytics. The storage notice states that the app uses IndexedDB and no tracking cookies. Privacy and terms list `raytheboffin@gmail.com` as the project contact. Optimize every raster icon before committing it.

- [ ] **Step 4: Run the full automated verification matrix**

Run: `npm run lint && npm run typecheck && npm test -- --run && npm run build && npm run test:e2e`

Expected: every command exits 0; the production bundle contains the manifest, service worker, icons, robots, sitemap, and legal routes.

- [ ] **Step 5: Perform the real-iPhone field checklist**

Record results in `tasks/todo.md` for:

```text
Safari install → Home Screen launch → permission onboarding
Known-route distance comparison → rolling pace stability
Wake lock for a complete outdoor session
Speech over the user’s normal music app
Airplane-mode launch → workout → history save → relaunch
Refresh during active run → checkpoint resume
```

- [ ] **Step 6: Commit the verified release candidate**

```bash
git add .
git commit -m 'feat: complete installable offline running coach'
```

## Final Review

- [ ] Confirm every acceptance criterion in the design spec maps to a passing automated test or recorded iPhone field check.
- [ ] Confirm no route coordinates, account data, analytics traffic, secrets, or privileged keys exist in the build.
- [ ] Confirm all user-facing images have alt text and all controls are usable at enlarged iOS text sizes.
- [ ] Confirm the repository contains no placeholders, sample credentials, generated build output, or unapproved personal contact information.
- [ ] Compare the final diff against the empty repository and record the review in `tasks/todo.md`.
