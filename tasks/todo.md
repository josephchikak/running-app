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
- [ ] Task 6: Today, Plan, History, and Settings screens
- [ ] Task 7: GPS filtering and live run metrics
- [ ] Task 8: Speech, wake lock, and active run orchestration
- [ ] Task 9: Installability, offline operation, legal surfaces, and release verification

## Review

- Task 1: Mobile shell verified at 375×812. Lint, 1 test, typecheck, and production build pass. The first screen uses the pace-rail direction, keeps the primary action above the navigation/safe area, and avoids generic card-grid treatment.
- Task 2: Strict schemas cover plans, workout steps, settings, enrollment, checkpoints, results, and backups. Pace bands use the 30-minute 5K baseline with effort-first language. Lint, 11 tests, typecheck, build, and dependency audit pass.
- Task 3: Authored and schema-validated all 17 weeks, 68 run sessions, four reusable strength sessions, and ten bodyweight-first exercises. The UTC date-only scheduler keeps the Monday–Sunday rhythm stable across timezones. Lint, 21 tests, typecheck, and production build pass.
- Task 4: Added a deterministic workout reducer for time, distance, manual repetitions, pause/resume, navigation, and finish states. The mobile strength player includes accessible controls, progress, exercise instructions, and easier variations. Lint, 29 tests, typecheck, and production build pass.
- Task 5: Added schema-validated IndexedDB stores for settings, enrollment, schedule, active checkpoints, results, and local-only counters. Versioned backup export/import replaces data atomically only after full validation and never serializes route coordinates. Lint, 37 tests, typecheck, build, and dependency audit pass.
