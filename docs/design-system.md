# Running Coach Design Direction

## Subject and job

This is a personal endurance instrument used outdoors, often at a glance and while moving. Its primary job is to make the next action unmistakable: what to do now, how hard to do it, and what comes next.

## Tokens

- Deep petrol `#103638`: primary field, calmer and more specific than generic fitness black
- Pool tile `#1B4D4F`: raised or selected surfaces
- Track chalk `#F5F2E8`: primary text and daylight-friendly contrast
- Split yellow `#F4C453`: current action and progress marker
- Interval coral `#F0795E`: hard-effort and urgent state
- Recovery mint `#9CCFBD`: easy/recovery state

Typography uses packaged Manrope for instructions and Barlow Condensed for pace, time, and distance. Large numbers behave like a runner’s watch; prose remains open and highly legible.

## Layout concept

Screens are organized around a vertical pace rail inspired by lane markings. The rail shows workout progression without turning every item into a card.

```text
┌─────────────────────────────┐
│ Thu 25 Sep        week 1/17 │
│                             │
│ ●  TODAY                    │
│ │  Easy return              │
│ │                           │
│ │  35 min                   │
│ │  Conversation pace        │
│ ○  Next: strength A         │
│                             │
│ [ Start easy run          ] │
│ Today  Plan  History  More  │
└─────────────────────────────┘
```

Content is left-aligned. The active metric may span the full width, but secondary information follows the rail rather than entering a uniform card grid. Controls near the bottom respect iPhone safe-area insets.

## Principles

1. One dominant action per screen.
2. Distance and time are glanceable before decorative content appears.
3. Color identifies training state and signal quality, never decoration alone.
4. Workout progress reads as a continuous route, not a dashboard of tiles.
5. Motion responds to state changes; there are no ambient entrance animations during a run.

## Self-critique and revision

The initial instinct—dark background plus a bright performance accent—would resemble many generic fitness apps. The direction is revised toward deep petrol, chalk, and split yellow, with a lane-like pace rail as the single memorable device. Gradients, neon glows, excessive pills, all-caps labels, and interchangeable SaaS cards are excluded.

