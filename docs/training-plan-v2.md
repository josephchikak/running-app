# Personal running plan, version 2

## Purpose and starting assumption

Four runs each week, Tuesday/Thursday bodyweight-first strength, Saturday long run or benchmark, Sunday full rest. The first eight weeks aim to rebuild a faster 5K from an approximately 30-minute current result (25 minutes was possible last year); week 9 absorbs that block; weeks 10–17 extend endurance to a comfortable 10K. Recent weekly training volume is not yet known, so the opening weeks must be conservative. A 25-minute 5K is a historical achievement, not a pace prescription for today's workouts.

## Evidence and interpretation

- [World Athletics on aerobic fitness](https://worldathletics.org/personal-best/performance/how-build-aerobic-fitness-tips-advice-running) describes comfortable running as a major endurance stimulus, potentially most of weekly distance. Easy running is not filler.
- [World Athletics on speed training](https://worldathletics.org/personal-best/performance/speed-training-endurance-runners-benefits-limits) describes a weekly speed session for many runners, recovery running after it, and building demanding sessions over months rather than jumping into advanced repetitions.
- [Hal Higdon's novice 10K](https://www.halhigdon.com/training-programs/10k-training/novice-10k/) is mostly comfortable running and gradually extends the long run. His [intermediate 10K](https://www.halhigdon.com/training-programs/10k-training/intermediate-10k/) alternates intervals and tempo while retaining easy runs, but assumes five to six runs per week and a larger training base than this plan.
- [World Athletics on self-coaching](https://worldathletics.org/news/performance/mara-yamauchi-guide-be-your-own-coach) recommends changing frequency, volume, or intensity gradually, not all at once. [Its strength guidance](https://worldathletics.org/news/performance/strength-and-conditioning-for-beginning-runners) supports two manageable strength sessions per week.
- A [randomized study in recreational runners](https://pmc.ncbi.nlm.nih.gov/articles/PMC7739641/) found improvements with different intensity distributions and did not establish one universally superior formula. This plan therefore uses effort cues and a conservative workload progression, not a rigid 80/20 claim or promised finish time.

## Weekly rhythm

| Day | Role | Why |
| --- | --- | --- |
| Monday | Short recovery/aerobic run | Easy volume after Saturday's long run and Sunday rest |
| Tuesday | Strength A | Legs, calves, trunk; light version in cutback/taper weeks |
| Wednesday | Key run | One controlled fartlek, hill, interval, tempo, or progression workout |
| Thursday | Strength B | Hips and control; keep it manageable after Wednesday |
| Friday | Short support run | Alternate plain recovery and relaxed strides; no second hard workout before Saturday |
| Saturday | Long run or checkpoint | Mostly conversational, with short steady sections in selected weeks |
| Sunday | Full rest | No prescribed exercise |

The four runs have distinct jobs. Variation belongs chiefly in the Wednesday stimulus, occasional controlled long-run finishes, and the short Friday leg-speed touch; it does not mean making every run hard. Recovery/cutback weeks are 4, 8, 9, 13, and 17.

## Authored progression

| Week | Goal | Wednesday key work | Saturday |
| --- | --- | --- | --- |
| 1 | Re-enter routine | Six 1-minute relaxed fartlek efforts | 35-minute conversational long run |
| 2 | Build mechanics | Six short gentle-hill efforts | 40-minute easy long run |
| 3 | Introduce threshold | Three 5-minute comfortably-hard blocks | 45 minutes, last 6 steady |
| 4 | Absorb load | Four light 1-minute pickups | 35-minute easy long run |
| 5 | 5K rhythm | Five 3-minute controlled 5K efforts | 48-minute easy long run |
| 6 | Sustain effort | Two 8-minute threshold blocks | 52 minutes, last 8 steady |
| 7 | Specific endurance | Four 4-minute controlled 5K efforts | 55-minute easy long run |
| 8 | Taper and check | Four brief relaxed pickups | 5K checkpoint by current effort |
| 9 | Transition | Gentle easy run, no quality target | 35-minute easy long run |
| 10 | Rebuild | Five 3-minute steady fartlek efforts | 45-minute easy long run |
| 11 | Extend threshold | Three 6-minute threshold blocks | 50-minute easy long run |
| 12 | 10K rhythm | Five 4-minute controlled 10K efforts | 55 minutes, last 8 steady |
| 13 | Absorb load | Five short gentle-hill efforts | 45-minute easy long run |
| 14 | Sustain 10K effort | Two 10-minute threshold blocks | 60 minutes, last 10 steady |
| 15 | Specific endurance | Four 6-minute controlled 10K efforts | 65-minute easy long run |
| 16 | Consolidate | 25-minute easy-to-steady progression | 70 minutes, last 12 steady |
| 17 | Taper and complete | Four brief relaxed pickups | 10K completion run by effort |

Every key run has a warm-up, explicit recoveries, and a cool-down. Hill efforts are effort-based, not pace-based. Strides are short and relaxed, never sprints. The 5K and 10K checkpoints are feedback, not pass/fail tests. If an effort or long run feels too demanding, slowing down, walking, or repeating a week is preferable to forcing the prescription.

## Application and data safety

- Publish this as plan version 2 with new workout IDs. Retain version 1 workout templates so previously completed and active sessions remain interpretable.
- Migrate only scheduled, unstarted entries to matching version 2 workouts. Preserve their dates and schedule IDs. Preserve completed/skipped entries, saved results, and the workout attached to an active checkpoint.
- Update enrollment version and schedule in one IndexedDB transaction. A version 1 backup restored later should follow the same migration.
- In the Plan screen, show each workout's description/purpose. When enrolled, display the saved scheduled workout rather than assuming the current template's ID, so historical rows remain accurate.
- No GPS, speech, database format, or route-coordinate collection changes are required.
