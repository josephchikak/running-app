# Personal Running Coach

## Plan

- [x] Agree on product scope and iPhone PWA constraints
- [x] Create and clone `josephchikak/running-app`
- [x] Add the approved design specification
- [x] Write the implementation plan
- [x] Task 1: Tested PWA foundation and mobile shell
- [x] Task 2: Domain models, validation, and pace guidance
- [x] Task 3: Authored plans and calendar scheduling
- [x] Task 4: Pure workout engine and guided strength player
- [x] Task 5: IndexedDB, recovery, and backup
- [x] Task 6: Today, Plan, History, and Settings screens
- [x] Task 7: GPS filtering and live run metrics
- [x] Task 8: Speech, wake lock, and active run orchestration
- [ ] Task 9: Installability, offline operation, legal surfaces, and release verification — implementation complete; iPhone field check pending
- [x] Task 10: Flexible workout selection and missed-session recovery
  - [x] Add tested overdue-session and schedule-status domain helpers
  - [x] Add Catch up, selectable Plan sessions, and confirmed skipping
  - [x] Record and display planned versus actual workout dates
  - [x] Run clean verification and push the deployment branch

## Review

- Task 1: Mobile shell verified at 375×812. Lint, 1 test, typecheck, and production build pass. The first screen uses the pace-rail direction, keeps the primary action above the navigation/safe area, and avoids generic card-grid treatment.
- Task 2: Strict schemas cover plans, workout steps, settings, enrollment, checkpoints, results, and backups. Pace bands use the 30-minute 5K baseline with effort-first language. Lint, 11 tests, typecheck, build, and dependency audit pass.
- Task 3: Authored and schema-validated all 17 weeks, 68 run sessions, four reusable strength sessions, and ten bodyweight-first exercises. The UTC date-only scheduler keeps the Monday–Sunday rhythm stable across timezones. Lint, 21 tests, typecheck, and production build pass.
- Task 4: Added a deterministic workout reducer for time, distance, manual repetitions, pause/resume, navigation, and finish states. The mobile strength player includes accessible controls, progress, exercise instructions, and easier variations. Lint, 29 tests, typecheck, and production build pass.
- Task 5: Added schema-validated IndexedDB stores for settings, enrollment, schedule, active checkpoints, results, and local-only counters. Versioned backup export/import replaces data atomically only after full validation and never serializes route coordinates. Lint, 37 tests, typecheck, build, and dependency audit pass.
- Task 6: Replaced shell placeholders with tested enrollment, setup confirmation, Today, 17-week Plan, summary-only History, and Settings flows. Settings includes baseline/cues, validated backup/restore, and confirmed local erasure. Non-critical routes are split into lazy chunks. Lint, 46 tests, typecheck, build, and a 375×812 visual check pass.
- Task 7: Added a foreground high-accuracy GPS adapter with named accuracy, drift, speed, and staleness thresholds. Haversine distance and rolling-window pace calculations are deterministic, and stop always releases the browser watch. Lint, 54 tests, typecheck, and production build pass.
- Task 8: Composed the workout engine, filtered GPS, sequential speech cues, vibration fallback, screen wake lock, checkpoint restore, and local completion into a full-screen run player. Partial finishes require confirmation and are saved as stopped sessions. Lint, 59 tests, typecheck, and production build pass.
- Task 9: Added the installable PWA manifest and service worker, black-and-orange app/icon system, route metadata, legal pages, local storage notice, install guidance, custom error fallback, robots, sitemap, and two Playwright release flows. Lint, 62 tests, typecheck, production build, dependency audit, and a 390×844 production-preview walkthrough pass. Playwright browser launch is blocked by the managed macOS sandbox, so the real-device install, offline reload, spoken cue, wake-lock, GPS, and background-behavior checks remain for an iPhone field pass.
- Task 10: Kept the authored calendar fixed while making every unfinished run or strength session selectable. Today now surfaces overdue sessions under Catch up, Plan provides Start and confirmed Skip controls, completed results preserve both planned and actual dates, and scheduled strength sessions save into the same local history. Lint, 70 tests, typecheck, production PWA build, and a 390×844 walkthrough pass with no console errors.
