# Brain Boosters: rules and behaviour review

Reviewed 24 September 2026, following reports of jumping and flickering.

## Research and rule decisions

- **Finger Follow:** steady visual tracking, with the head comfortably still, is described in [Mersey Care NHS guidance](https://www.merseycare.nhs.uk/patient-leaflets/balance-and-gait). The portal uses a gentle recreational adaptation: one continuously moving dot, selectable path and pace, three 20-second rounds. It does not measure eye movements or claim clinical results. Calm play keeps the dot still and advances rounds manually.
- **Simon Says / colour memory:** [Hasbro's Simon instructions](https://instructions.hasbro.com/en-us/instruction/simon-game-for-kids-ages-8-and-up) describe remembering and repeating a growing colour sequence. This portal's tab is the visual, Simon-style memory activity suggested by the reference, not the playground command game. It starts with one colour, repeats the existing order and adds one item. Four labelled pads prevent reliance on colour alone. The portal explicitly uses practice rules: retries and untimed recall, rather than claiming the original commercial game's loss and time-limit rules.
- **Clap Pattern:** Harvard's [executive-function activity guide](https://developingchild.harvard.edu/resources/handouts-tools/activities-guide-enhancing-and-practicing-executive-function-skills/) includes copying actions and clapping rhythms. The portal demonstrates evenly spaced Clap/Snap/Stomp cues, hides the sequence, then accepts button presses in order. Each round presents a new, longer pattern. Physical clapping and timing accuracy are not detected; only the entered order is scored.
- **Memory Chain:** the [Belmont Primary School memory games guide](https://www.belmontprimary.com/memory-games) describes repeating an existing shopping list and adding another item. This solo adaptation begins with one item; after recalling the full list, the student chooses the next item to append. Repeated items are allowed and must be recalled separately.
- **Balloon Eyes:** no authoritative standard ruleset for this exact name was identified. Its rules are defined from the supplied reference: identify the displayed colour, pop one balloon before it leaves the board, count it once, and continue through ten balloons. Three successful pops increase the next balloon's speed, with an age-dependent minimum duration. Calm play is untimed. A fixed Pop balloon button supports keyboard use.

Memory activities award 10 session points per item only after the full round is correct. Incorrect answers award nothing and offer replay. Sessions finish at six items for younger students or nine for older students. These points are not portal reward points. Switching activities starts a new session, as stated in the UI.

## Issues found and changes

| Finding | Change |
| --- | --- |
| Finger Follow was a timed target-catching game; each tap changed its coordinates immediately. Browser reproduction measured an approximately 86px jump after one tap. | Replaced with continuous horizontal, vertical, and figure-eight paths. No tap, hit, or streak claim is attached to eye tracking. |
| A JavaScript interval and CSS keyframes independently controlled expiry and position. Timed re-renders occurred about every 80ms. | One requestAnimationFrame clock now drives position and completion. Transforms update directly; React only updates relevant status. Pause retains elapsed time. Stalled frames are bounded and hidden tabs pause. |
| Balloons respawned in the same instant as the pop, changing colour and position without a separation. | A 650ms result phase separates balloons; a new balloon begins only after that phase. Duplicate clicks and stale callbacks cannot score it. |
| Reset could reuse target zero while an old timer event still referred to it. | Session versions guard all balloon completion events across reset, replay, and target changes. |
| Memory cues disappeared into repeated “Get ready” placeholders between every item. Pads also scaled and translated. | The central cue stays present through the separation; only its outline changes. Removed pad scaling, hover movement and opacity transitions. |
| Stage, answer wrapping and changing controls could move the board and alter scroll position. | Fixed stage geometry, compact wrapped answer tokens, stable controls, reserved feedback space and disabled scroll anchoring. Mobile controls use a stable grid. |
| All memory modes were essentially the same growing random sequence. | Clap uses a new rhythm each round; Simon preserves and extends its sequence; Memory Chain lets the player append an item. |
| Simon and Memory Chain started with multiple items, obscuring the basic rule. | Both start with one item for every age band. Longer caps and quicker playback provide the older-student challenge. |
| Scoring, retry policy, completion limit and input method were not explained. | Added rules immediately above each game, with explicit practice scoring and session limits. |
| Fast automatic cues were the only playback method. | Added step-by-step playback; it is selected automatically for reduced-motion/calm play. |
| Controls disappeared between exercise phases and could wrap differently on phones. | Exercise Start/Pause, Skip and Reset retain their positions; unavailable actions are disabled. |

## Verification

Result: **20/20 logic tests and 74/74 Chrome checks passed**, with zero browser errors in both grade bands. In the captured follow runs, the maximum movement between consecutive frames was 1.37px for kids and 1.65px for older students. Production build and targeted ESLint passed. The build still reports the app's large-chunk warning.

- `npm test`: pure-rule regressions for path continuity and boundaries, pause/reset, stale callbacks, score integrity, ten-balloon completion, age settings, cue gaps, manual recall, pattern growth and chosen chain items.
- `npx eslint src/modules/student/components/brainBoosters src/modules/student/pages/BrainBoostersPage.jsx` and `npm run build`.
- `.claude/testing/scenarios/brain-boosters.mjs`: isolated Chrome checks with mocked API data for both student bands, real keyboard/button actions, frame-to-frame movement, pause/resume, background tabs, misses, all three memory modes, phone layouts, dark appearance, exercises and saved reduced-motion preferences.
- No backend or shared student data changes are needed. No sound, microphone or camera access is required.
