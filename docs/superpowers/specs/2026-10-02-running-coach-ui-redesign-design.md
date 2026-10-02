# Running Coach UI Redesign

## Purpose

Refresh the personal running coach as a polished, mobile-first training instrument while preserving its existing black-and-orange identity, authored plans, offline behavior, local-only storage, and workout logic. The live application is the visual prototype; no separate mockup phase is required.

The interface should feel calm, athletic, and useful at a glance. It may borrow information-hierarchy patterns from the supplied fitness references, but it must remain recognizably built around running rather than becoming a generic health dashboard.

## Scope

The redesign covers:

- the application shell and primary navigation
- Today and its enrollment, scheduled, completed, skipped, rest, error, and catch-up states
- the 17-week Plan and its phase, week, session, completion, start, and skip states
- History and its empty and populated states
- Settings, installation guidance, backup, legal links, messages, and destructive confirmation
- the active run player and all GPS, wake-lock, pause, resume, finish, and capability states
- the strength player and its active, paused, easier-option, progress, and completion states
- shared loading, empty, error, focus, reduced-motion, safe-area, and desktop-responsive behavior

This is a presentation and information-hierarchy change. It does not alter workout prescriptions, plan scheduling, persistence schemas, GPS filtering, speech behavior, backup format, or privacy model.

## Visual System

### Palette

- Night `#070707`: page background
- Track `#11100F`: primary panel background
- Warm graphite `#1A1714`: raised and selected surfaces
- Chalk `#FFF7ED`: primary text
- Muted chalk `#A9A099`: secondary text
- Signal orange `#FF6A00`: primary action, current state, and progress
- Sprint orange `#FF3D00`: destructive, urgent, or hard-effort state

Orange is functional rather than decorative. It identifies the current session, progress, and the primary action. The interface uses solid surfaces and restrained borders rather than glass effects, ornamental gradients, or stock imagery.

### Typography

Manrope remains the interface and instructional face. Barlow Condensed remains the display and metric face for workout names, time, pace, distance, week numbers, and progress. Numerical displays use tabular figures where changing values would otherwise shift.

### Signature device

An orange track line connects the product visually:

- it becomes the progress lane in the Today hero
- it marks the current day in the weekly strip
- it forms the chronology of the 17-week plan
- it becomes step progress in live run and strength players

This device prevents the redesign from reading as a generic collection of dark rounded cards.

### Shape and depth

Shape communicates hierarchy:

- the Today workout hero uses the largest radius and strongest surface
- compact metrics use smaller radii
- plan, history, and settings rows rely primarily on rhythm and dividers
- the navigation dock is the only persistent pill-shaped element

Shadows are subtle and limited to the bottom dock and temporary notices. Borders use low-contrast chalk rather than bright outlines.

## Screen Design

### Application shell

On phones, content fills the screen with safe-area padding and ends above a floating four-item navigation dock. Navigation items use local inline SVG icons plus short labels; active state is signalled by orange and shape, not color alone. Workout routes remain distraction-free and omit the dock.

On larger screens, the interface stays centered at a useful reading width. It does not stretch into a sparse desktop dashboard. The dock may sit within the centered app frame rather than becoming a full-width desktop sidebar.

### Today

Today begins with the full date and current plan week. Its main workout occupies a single hero panel containing:

- workout title and short purpose
- estimated duration and weekly completion count
- a track-line progress treatment
- one unambiguous Start, Resume, Completed, or Skipped state

Below the hero, a seven-day strip shows the current training week using scheduled status. A weekly summary uses only real local data: completed session count, recorded duration, and recorded distance. Missed sessions remain available under Catch up as compact action rows. The pre-enrollment and rest-day versions retain the same visual hierarchy.

### Plan

The three authored phases remain visible as sections. Weeks become stops on a continuous plan route. The current or earliest unfinished week opens automatically. An expanded week lists sessions chronologically with day, date, title, duration, status, Start, and confirmed Skip controls. Controls remain at least 44 CSS pixels high.

### History

When results exist, History opens with totals derived from saved results:

- completed workout count
- accumulated active time
- accumulated distance

Individual results emphasize workout title, completion date, distance, time, and average pace. Planned-versus-completed timing appears only when the dates differ. The empty state remains directive and does not render zero-value analytics as if training had occurred.

### Settings

Settings uses clearly separated groups for Training, Backup, Install, About, and Erase data. Form inputs and switches have visible labels, states, and focus treatment. Backup, restore, and erase messaging stays inline and actionable. Destructive confirmation remains explicit.

### Active run

The run player prioritizes safe glanceability:

- GPS and wake-lock state at the top
- current step and workout progress
- oversized remaining time or distance
- concise instruction and pace/effort guidance
- distance, average pace, and elapsed time in one secondary row
- a thumb-reachable Pause or Resume control
- secondary Skip and Finish actions with finish confirmation

No decorative dashboard panels compete with the current instruction.

### Strength player

The strength player mirrors the run hierarchy with exercise name, timer or repetitions, step lane, instruction, easier variation, and large controls. The easier option is a quiet supporting panel rather than a competing card. Completion clearly indicates that the result was saved locally.

## Architecture and Components

Existing domain, persistence, and workout orchestration remain unchanged. Presentation logic is composed from small, testable helpers and components:

- local icon components for primary navigation and workout states
- weekly schedule/status presentation helpers
- pure history and weekly-total selectors derived from existing schedule and results
- reusable progress-lane and metric presentation components where repetition justifies them

The redesign should prefer semantic HTML and CSS over client-side measurement. No new product dependency, remote font, image host, analytics service, environment variable, or network request is introduced. Existing lazy route boundaries remain intact.

## Data Flow

Today reads the current schedule and saved results from `TrainingContext`, derives the current-week status strip and totals, and renders them without persisting new data. History derives aggregate totals from the existing result list. Plan continues to call the existing start and skip flows. Run and strength players continue to use the existing controllers and completion handlers.

All displayed metrics must be traceable to schedule or result data already stored on the device. Calories, recovery scores, heart rate, elevation, social activity, and map routes are excluded because the app does not collect them.

## Error, Loading, and Empty States

Loading states preserve the final layout footprint where practical. Errors remain readable, high-contrast, and specific about the available recovery action. Empty states explain the next action. Offline operation does not change. Storage, GPS, wake-lock, import, and destructive-action messages remain visible to assistive technology through existing status and alert semantics.

## Accessibility and Responsive Requirements

- primary actions and navigation targets are at least 44 by 44 CSS pixels
- focus-visible states remain unmistakable
- text and functional controls meet WCAG AA contrast against their surfaces
- active navigation and workout status are not communicated by color alone
- motion is limited to user-triggered state changes and respects `prefers-reduced-motion`
- no horizontal overflow at 320, 375, or 390 CSS pixels
- content remains usable with enlarged text and iPhone safe-area insets
- live-workout controls stay reachable without requiring precise taps

## Testing and Verification

Implementation follows test-driven development for new selectors and changed UI behavior. Existing behavior tests remain authoritative for plan start, workout start, catch-up, skipping, history, settings, run controls, and strength completion.

Release verification includes:

- lint and TypeScript checks
- the complete Vitest suite
- a production PWA build
- dependency audit and committed-secret scan
- mobile walkthroughs at 375 by 812 and 390 by 844
- desktop sanity check
- Today states, plan expansion/actions, populated and empty History, Settings controls, active run controls, and active strength controls
- keyboard focus, console errors, horizontal overflow, and 44-pixel target checks

## Success Criteria

The redesign is complete when the app feels like one coherent black-and-orange running instrument, the next workout is immediately understandable, weekly progress is visible without invented data, workout controls are safer to use while moving, all existing behavior remains intact, and the verified production build is ready to push to the deployment branch.
