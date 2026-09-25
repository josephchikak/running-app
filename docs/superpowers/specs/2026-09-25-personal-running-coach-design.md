# Personal Running Coach PWA — Design Specification

## Purpose

Build a private, installable iPhone web app that tells Joseph what workout to do each day, guides him through runs and strength sessions, measures running distance with foreground GPS, and records completion history.

The product is a personal training tool rather than a commercial alternative to Runna. It uses authored plans and deterministic workout logic. It does not generate plans with AI.

## Success Criteria

- The app installs from Safari with **Add to Home Screen** and opens as a standalone PWA.
- After the first load, the app, plans, and active workout player work without internet access.
- The Today screen clearly presents the scheduled workout or rest day.
- A run can be started with one tap and completed using spoken guidance without repeatedly reading the screen.
- During a run, the app reports elapsed time, accepted GPS distance, average pace, current-step progress, and the next step.
- The screen stays awake while a workout is active whenever iOS grants a wake lock.
- An interrupted or refreshed workout can be restored without losing meaningful progress.
- Strength sessions provide exercise instructions, work/rest timers, and spoken transitions.
- Completed sessions are saved locally and can be exported and restored from a versioned backup file.
- The initial plan sequence supports improving a current 30-minute 5K toward the previous 25-minute level, then building to 10K.

## Product Constraints

- Primary device: iPhone.
- Distribution: HTTPS web deployment installed as a PWA; no App Store package.
- GPS tracking is foreground-only. The screen must remain awake and the app visible during tracked runs.
- Storage is local-first with no login, cloud database, or automatic syncing.
- Spoken prompts are the primary guidance mechanism, with visible text and tones/vibration as fallbacks.
- Pace guidance combines a numerical pace range with a perceived-effort cue.
- The first release is for one person and one active plan at a time.

## Scope

### Included

- Installable mobile-first PWA
- Preset Faster 5K and Build to 10K plans
- Fixed weekly schedule
- Today dashboard and plan calendar
- Running workout player
- Strength workout player
- Foreground GPS distance and pace calculation
- Spoken workout cues
- Screen wake lock
- Offline use
- Workout history
- Local settings
- Backup and restore
- Permission, interruption, and weak-GPS handling

### Excluded

- Accounts and cloud sync
- AI-generated or automatically adapted plans
- Social feed, followers, leaderboards, or sharing
- Route discovery or route maps
- Apple Health, Strava, watch, heart-rate, or wearable integrations
- Music playback or music-volume control
- Locked-screen/background GPS guarantees
- Push notifications
- Payments, subscriptions, or multiple users
- Nutrition, injury diagnosis, or medical guidance

## Training Structure

### Plan sequence

1. **Faster 5K — 8 weeks**
   - Weeks 1–2: rebuild consistency and controlled speed
   - Weeks 3–5: improve threshold and speed endurance
   - Weeks 6–7: 5K-specific sessions
   - Week 8: reduced load and 5K benchmark
2. **Transition — 1 week**
   - Reduced running load, easy strength, no benchmark effort
3. **Build to 10K — 8 weeks**
   - Weeks 1–2: consolidate the 5K block and extend easy running
   - Weeks 3–5: increase long-run duration and threshold volume
   - Weeks 6–7: 10K-specific endurance
   - Week 8: reduced load and 10K completion or benchmark

The 25-minute 5K is a direction, not a promised result or mandatory deadline. The plan remains usable if progress is slower.

### Weekly rhythm

| Day | Session |
| --- | --- |
| Monday | Easy run |
| Tuesday | Strength A |
| Wednesday | Intervals, hills, or threshold intervals |
| Thursday | Strength B and mobility |
| Friday | Short easy run with strides |
| Saturday | Long easy run or controlled tempo within a longer run |
| Sunday | Full rest |

### Intensity guidance

Each running step contains both:

- A pace range derived deterministically from the configured current 5K time, initially 30:00
- A short effort cue, such as “easy conversation pace,” “comfortably hard,” or “hard but controlled”

Effort is authoritative when terrain, weather, heat, fatigue, or GPS quality makes pace unreliable. The app never increases workout difficulty automatically.

### Strength sessions

- Two 20–25 minute sessions each week
- Bodyweight first, with optional resistance-band alternatives
- Emphasis on calves, quads, hamstrings, glutes, hips, trunk stability, and single-leg control
- Every exercise has a name, concise instruction, duration or repetitions, rest duration, and easier variation
- Strength volume remains conservative around harder running weeks
- Pain and stop guidance is displayed before the first session; the app does not diagnose injuries

## Information Architecture

### Today

The default screen shows:

- Current plan and week
- Today’s session or rest status
- Workout summary and estimated duration
- Primary Start button above the fold
- Next scheduled session
- Current weekly completion progress

### Plan

- Entire 17-week sequence grouped by phase and week
- Current week expanded by default
- Session detail preview
- Completed, current, upcoming, missed, and manually completed states
- Start-date selection and reset-plan action

### Active Workout

Full-screen, high-contrast interface with:

- Current instruction
- Large elapsed time or step countdown
- Distance
- Smoothed current pace
- Average pace
- Current pace range and effort cue
- Next step
- GPS and wake-lock indicators
- Large pause/resume and finish controls
- Confirmation before ending an incomplete workout

The running view uses a dark, low-distraction presentation suitable for an awake screen in a pocket or armband.

### History

- Reverse-chronological completed sessions
- Date, workout name, duration, distance, average pace, and completion status
- Detail view with completed steps and optional notes
- No saved route map

### Settings

- Current 5K time, initially 30:00
- Metric units
- Speech enabled, voice selection when supported, and cue volume test
- Vibration/tones fallback toggle
- GPS accuracy status help
- Export backup, import backup, and erase local data
- PWA installation instructions

## Technical Architecture

### Stack

- React with TypeScript
- Vite
- Tailwind CSS
- Vite PWA/service-worker integration
- IndexedDB through a small typed persistence adapter
- Browser Geolocation, Screen Wake Lock, Speech Synthesis, and Vibration APIs behind capability adapters
- Vitest and React Testing Library for unit/integration tests
- Playwright for browser-level mobile tests

No server runtime is required. Static hosting over HTTPS is sufficient.

### Module boundaries

1. **Plan catalog**
   - Owns immutable plan templates, workouts, steps, exercises, and training copy.
   - Has no browser or storage dependencies.
2. **Scheduler**
   - Expands a selected plan and start date into calendar entries.
   - Owns day assignment and workout status rules.
3. **Workout engine**
   - Pure state machine for step progression, countdowns, pause/resume, skip, finish, and restoration.
   - Accepts time and distance events without knowing their browser source.
4. **GPS adapter**
   - Wraps `navigator.geolocation.watchPosition`.
   - Filters inaccurate or implausible samples and emits accepted distance events and signal status.
5. **Cue adapter**
   - Produces speech, tones, and vibration cues from workout-engine events.
6. **Wake-lock adapter**
   - Requests, monitors, and reacquires a screen wake lock while the document is visible.
7. **Persistence adapter**
   - Saves settings, plan state, active-session checkpoints, and completed summaries in IndexedDB.
8. **Backup service**
   - Exports and validates a versioned JSON representation of local data.
9. **UI shell**
   - Presents Today, Plan, Active Workout, History, and Settings while consuming the modules above.

These boundaries keep training content, browser capabilities, storage, and presentation independently testable.

## Core Data Model

- `PlanTemplate`: metadata, phases, weeks, and immutable workout references
- `WorkoutTemplate`: run or strength type, summary, estimated duration, and ordered steps
- `WorkoutStep`: time/distance completion rule, intensity, instruction, cue text, and repetition structure
- `Exercise`: instruction, work/repetition target, rest, easier variation, and equipment
- `PlanEnrollment`: plan ID, start date, current state, and configured baseline
- `ScheduledWorkout`: calendar date, template reference, and completion state
- `ActiveSession`: workout snapshot, engine state, timing state, accepted distance, and last checkpoint
- `GpsSample`: coordinates, timestamp, accuracy, and derived acceptance result; retained only during an active session
- `WorkoutResult`: summary metrics, completed steps, status, and notes; does not retain a route trace
- `UserSettings`: units, current 5K time, cue preferences, and schema version

Plan templates are versioned so future content edits do not silently change an already-started plan.

## Run Tracking

1. Starting a run is a user gesture that initializes speech, requests location permission, and requests the wake lock.
2. The GPS adapter requests high-accuracy position updates.
3. Samples with excessive reported accuracy or implausible movement are rejected.
4. Distance is accumulated from accepted points using geodesic distance.
5. Average pace uses accepted total distance and moving elapsed time.
6. Current pace uses a rolling window to avoid noisy instant GPS values.
7. The workout engine advances time-based or distance-based steps and emits cue events.
8. Session state is checkpointed after meaningful changes and at a short interval.
9. On completion, only summary metrics and step results are retained; raw coordinates are discarded.

Thresholds remain named constants and are covered by tests so they can be tuned during outdoor testing.

## Spoken Guidance

- Speech is initialized by the Start interaction to satisfy browser media restrictions.
- Cues cover workout start, step changes, short countdowns, pace/effort reminders, halfway, GPS loss/recovery, pause/resume, and completion.
- Repeated pace warnings are rate-limited to avoid constant talking.
- A cue queue prevents overlapping speech.
- If speech is unavailable or fails, the app uses tones/vibration and prominent on-screen text.
- Audio interaction with music apps is device-dependent and must be tested on the target iPhone; the app does not promise audio ducking.

## Offline and Installation

- The web manifest defines standalone display, theme colors, orientation preference, and application icons.
- An Apple touch icon and appropriate mobile metadata are included.
- The service worker precaches the application shell, plan content, fonts, and local exercise illustrations if used.
- The app does not require a network connection to start or finish a workout after the initial installation.
- Updates are applied between workouts, never by reloading an active workout unexpectedly.

## Persistence and Recovery

- IndexedDB is the source of truth for mutable local data.
- Active sessions are checkpointed during execution and before page lifecycle transitions when possible.
- On launch, an unfinished session offers Resume or Discard.
- Backup exports include schema version, export time, settings, enrollment, schedule state, and results.
- Imports are parsed and validated before replacing any local data.
- Erase data requires explicit confirmation and creates no automatic remote copy.

## Error Handling

- **Location denied:** explain how to enable permission and allow a time-only untracked workout.
- **Weak or lost GPS:** keep the interval clock running, stop adding questionable distance, announce the issue once, and announce recovery.
- **Wake lock rejected/released:** show and speak a warning; retry when the document becomes visible.
- **Page hidden or phone locked:** warn that reliable tracking may stop and checkpoint immediately.
- **Speech failure:** fall back to tones/vibration and on-screen instructions.
- **Storage unavailable/full:** keep the current session in memory, warn immediately, and offer summary export at finish.
- **Corrupt backup:** reject it without altering existing data and show a specific validation error.
- **Interrupted session:** offer restoration from the most recent valid checkpoint.

## Privacy and Security

- No account, analytics SDK, advertising, or third-party tracking.
- No GPS points are uploaded.
- Raw coordinates are discarded after a workout summary is produced.
- Backup files are created only on explicit request.
- Imported data is treated as untrusted and schema-validated.
- The deployed app uses HTTPS and a restrictive content security policy compatible with its own assets.
- The app contains no secrets or privileged API keys.

## Accessibility and Mobile Usability

- Controls meet mobile touch-target guidance and remain usable while moving.
- Critical information is not communicated by color alone.
- Text remains readable at enlarged iOS text sizes.
- Active-workout controls use high contrast and minimal visual density.
- Spoken instructions always have equivalent visible text.
- Reduced-motion preferences are respected.
- Destructive actions require confirmation and are separated from primary workout controls.

## Testing Strategy

### Unit tests

- Calendar expansion and weekday placement
- Plan-template validation and version handling
- Workout state-machine transitions
- Time- and distance-based step completion
- Pause/resume and restoration math
- Geodesic distance calculation
- GPS accuracy, spike, and pace-window filtering
- Cue ordering and rate limiting
- Backup serialization, validation, and migration

### Integration tests

- IndexedDB persistence and unfinished-session restoration
- Permission-denied and unsupported-capability fallbacks
- Service-worker offline startup
- Plan start/reset and history creation
- Run and strength workout completion flows

### Browser tests

- iPhone-sized Today, Plan, Workout, History, and Settings flows
- Mocked geolocation movement
- Mocked wake-lock acquisition and release
- Mocked speech success and failure
- Installation metadata and offline reload

### Manual iPhone verification

- Install from Safari and launch from the Home Screen
- Permission onboarding
- Outdoor distance comparison against a known route or trusted tracker
- Pace stability at walking, easy, and faster running speeds
- Screen wake behavior for a complete test session
- Spoken cues while another audio app is playing
- Airplane-mode workout start, completion, history save, and relaunch
- Refresh/crash recovery during an active session

## Delivery Sequence

1. Establish the tested data models, plan validation, and workout state machine.
2. Add the authored plan catalog and deterministic pace guidance.
3. Build Today, Plan, and local enrollment/history persistence.
4. Build the strength workout player.
5. Add GPS tracking and the running workout player.
6. Add speech, fallback cues, and wake-lock behavior.
7. Add PWA installation, caching, offline operation, backup, and restoration.
8. Complete automated verification and real-iPhone field testing.

## Acceptance Boundary

Version one is complete when Joseph can install the app on his iPhone, begin the Faster 5K plan, follow the fixed weekly schedule, complete guided run and strength sessions offline, receive spoken instructions with the screen awake, see reliable summary distance and pace, review history, and export a restorable backup.
