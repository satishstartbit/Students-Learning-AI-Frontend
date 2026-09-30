# Brain Boosters: rules and behaviour review

**Current layout: 30 September 2026.** Brain Boosters are part of the Focus page now (both bands), and each game or exercise has its own page. See "Folded into Focus" at the end; the sections before it are history.

**Current Finger Follow update: 28 September 2026.** The local video reference replaces the earlier corridor design. Historical research and checks below are retained as history; the video-reference section describes the current implementation.

Reviewed 24 September 2026, following reports of jumping and flickering. Finger Follow updated 25 September 2026 to the requested hold-and-steer rules.

## Research and rule decisions

- **Finger Follow (current, video reference):** the supplied `25.09.2026_22.38.05_REC.mp4` is 25.399 seconds at 604 x 674. Sixteen timestamped samples show the introductory follow-and-tap screen: Slow/Medium/Fast, Rounds/Taps/Streak, teal progress, a solid purple board, an eye icon, Let?s go, and tap-when-glowing instructions. This latest reference supersedes the earlier scrolling-corridor request. It does not show an active round, so exact movement, glow timings and round duration cannot be inferred from the recording. The portal uses smooth automatic motion, one point per glow, a three-round 20-second session, and a longer cue window for younger students. An outside-circle tap resets taps and streak to zero without teleporting the dot, preserving the user's explicit scoring requirement. Pause/resume, hidden-tab pausing and keyboard tapping are supported. Calm mode is stationary and uses five manual taps per round. These timing choices are portal adaptations, not observed reference behaviour.
- **Simon Says / colour memory:** [Hasbro's Simon instructions](https://instructions.hasbro.com/en-us/instruction/simon-game-for-kids-ages-8-and-up) describe remembering and repeating a growing colour sequence. This portal's tab is the visual, Simon-style memory activity suggested by the reference, not the playground command game. It starts with one colour, repeats the existing order and adds one item. Four labelled pads prevent reliance on colour alone. The portal explicitly uses practice rules: retries and untimed recall, rather than claiming the original commercial game's loss and time-limit rules.
- **Clap Pattern:** Harvard's [executive-function activity guide](https://developingchild.harvard.edu/resources/handouts-tools/activities-guide-enhancing-and-practicing-executive-function-skills/) includes copying actions and clapping rhythms. The portal demonstrates evenly spaced Clap/Snap/Stomp cues, hides the sequence, then accepts button presses in order. Each round presents a new, longer pattern. Physical clapping and timing accuracy are not detected; only the entered order is scored.
- **Memory Chain:** the [Belmont Primary School memory games guide](https://www.belmontprimary.com/memory-games) describes repeating an existing shopping list and adding another item. This solo adaptation begins with one item; after recalling the full list, the student chooses the next item to append. Repeated items are allowed and must be recalled separately.
- **Balloon Eyes:** no authoritative standard ruleset for this exact name was identified. Its rules are defined from the supplied reference: identify the displayed colour, pop one balloon before it leaves the board, count it once, and continue through ten balloons. Three successful pops increase the next balloon's speed, with an age-dependent minimum duration. Calm play is untimed. A fixed Pop balloon button supports keyboard use.

Memory activities award 10 session points per item only after the full round is correct. Incorrect answers award nothing and offer replay. Sessions finish at six items for younger students or nine for older students. These points are not portal reward points. Switching activities starts a new session, as stated in the UI.

## Issues found and changes

| Finding | Change |
| --- | --- |
| Finger Follow previously jumped to new targets, then used an eye-follow adaptation that did not match the newly requested steering mechanic. | Replaced with an absolute-position hub and continuous scrolling corridor. One animation clock drives the drawn grid and collision geometry. Release freezes immediately; re-hold resumes at the same position and distance. |
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

Earlier review result (before the steering change): **20/20 logic tests and 74/74 Chrome checks passed**, with zero browser errors in both grade bands. In the captured follow runs, the maximum movement between consecutive frames was 1.37px for kids and 1.65px for older students. Production build and targeted ESLint passed. The build still reports the app's large-chunk warning.

- `npm test`: pure-rule regressions for corridor continuity, circular hit testing, walls, absolute steering, bounded frame delays, completion and boundaries, pause/reset, stale callbacks, score integrity, ten-balloon completion, age settings, cue gaps, manual recall, pattern growth and chosen chain items.
- `npx eslint src/modules/student/components/brainBoosters src/modules/student/pages/BoosterPage.jsx src/modules/student/pages/kid/KidBoosterPage.jsx` and `npm run build` (the old `BrainBoostersPage.jsx` was removed on 30 September 2026).
- `.claude/testing/scenarios/brain-boosters.mjs` (now opening each game's own page): isolated Chrome checks with mocked API data for both student bands, real keyboard/button actions, frame-to-frame movement, pause/resume, background tabs, misses, all three memory modes, phone layouts, dark appearance, exercises and saved reduced-motion preferences.
- No backend or shared student data changes are needed. No sound, microphone or camera access is required.

## Finger Follow steering verification (25 September 2026)

- 29/29 current frontend unit tests pass, including eight steering rule tests. Targeted ESLint and production build pass (existing large-chunk warning remains).
- `.claude/testing/scenarios/finger-follow.mjs`: 36/36 mocked Chrome checks pass for both age bands, mouse and touch holds/drags, circular hit boundaries, outside-click zeroing, release/resume, tab interruption, pointer cancellation, keyboard steering, mobile overflow and calm completion. No browser errors.
- Updated `.claude/testing/scenarios/brain-boosters.mjs`: 64/64 regression checks pass across balloons, all memory modes, exercises, both age bands, and calm mode. Combined current browser coverage: 100/100 checks.

## Follow-up research and defects (25 September 2026)

The previous short browser checks proved input handling but did not prove sustained play. Reviewing the implementation found that collision checks used the full vertical radius at the circle's left/right edges, effectively testing invisible square corners. A sweep found 1,405 valid circular placements that the old geometry rejected. Wall failure then replaced the entire state with a new start state, causing a visible teleport. The earlier 300-point completion rule was also an invented limit rather than the documented endless survival rule.

Corrections: test circular cross-sections, retain the course and contact location on failure, require an explicit retry, show a cancellable three-second hold countdown before start/resume, and remove the normal-mode score cap. Corridor turns begin sooner, scroll speed is clearer, generated routes vary on retry, and curvature and speed remain bounded for phone play. A resize notification with unchanged dimensions no longer interrupts a hold. The reduced-motion explanation explicitly says why a calm course stays still.

The updated browser test follows the rendered canvas boundaries through a long run, rather than reusing the game engine's expected coordinates or checking only the first second.

Follow-up verification: **33/33 frontend unit tests and 37/37 focused Chrome checks passed**, including a 27-second active run that follows the rendered canvas boundaries and reaches 435 points without collision or forced completion. Targeted ESLint and production build pass; the existing bundle-size warning remains.

The full Brain Boosters regression suite also passed 64/64 checks (101/101 combined Chrome checks). Replaced the large disabled Pause button with a direct start-on-circle instruction; release is the pause control and Try again is explicit after failure.

## Video reference implementation (28 September 2026)

- Replaced the corridor/countdown/endless engine with the visible follow-and-tap activity. Matched the intro, speed pills, counters, purple play area, coral start button and teal progress bar. Kept portal navigation and both student grade bands. Removed the old 900px card minimum for this game so the card fits the reference.
- Movement and scoring use one animation clock; a successful tap never changes the dot's position. One score per glowing window, missed-glow streak reset, wrong-time feedback, radial hit detection, outside-tap zeroing, pause/resume and finite completion have pure-rule coverage.
- The full visible reference clip remains on the intro. Playback timings and the moving path are explicit implementation choices; an exact active-play comparison would require a recording of an active round.
- Verification: 39/39 current frontend unit tests, targeted ESLint, production build, 27/27 focused Chrome checks and 64/64 other game regression checks. Build retains the pre-existing large-chunk warning.

Final full-session verification: `finger-follow-full-session.mjs` passed all three real-time rounds, completion, replay, accessible progress, compact 520 x 561 desktop card, phone/dark layouts, and no browser errors. Final screenshots: `.claude/testing/screenshots/follow-video-final-{desktop,phone,dark}.png`.

## Folded into Focus (30 September 2026)

Built to five mockups: Kids Focus (Calm & move), Kids Focus (Brain games), Kids Finger Follow, Grade 6+ Focus and Grade 6+ Finger Follow.

- **Where boosters live.** The separate `/student/brain-boosters` page is gone. That address now redirects to `/student/focus?boost=games`. Both navs lost their Brain Boosters entry, and Home's teaser links to Focus.
- **Grade 6+ Focus.** `components/focus/FocusBoostersCard.jsx` sits under the Focus Timer. It has Exercises and Brain Games tabs, a check-in suggestion ("You checked in feeling tense… Try Finger Follow"), three tiles, and the picked booster's description with a small preview and a Play or Start button. "What's making it hard?" and "More calming tools" (the admin toolkit) replaced the old "Feeling stuck?" card, whose `StuckToolkit.jsx` is kept but unused.
- **K-5 Focus.** "Need a minute first?" switches between Calm & move (Breathe, Wiggle, Listen) and Brain games. One "Try this" badge marks the best match for today's check-in.
- **Suggestions.** `boosters.js#suggestBooster` picks the first booster matching the earliest category the server ranks for today's mood. The categories are the admin-managed toolkit categories.
- **Booster pages.** Each booster opens `/student/focus/games/:id` or `/student/focus/exercises/:id`. Grade 6+ gets `pages/BoosterPage.jsx`: Back to Focus, the kind and length, the game, How it works, and Your pace, your space. K-5 gets `pages/kid/KidBoosterPage.jsx`: the game on its paper colour, How to play, About N min, Just for fun, and Maybe later. Exercises are Grade 6+ only, so a K-5 student opening one lands back on Focus.
- **Games on their own pages.** The games take `hideHeading`, because the page shows the title. K-5 Finger Follow shows "3 short rounds" and a round/tap line instead of the three counters, with the same test ids.
- **Breaks aren't focus time.** Opening a booster (6+) or a break card (K-5) while the clock runs pauses the session first.
- **Styles.** The deleted page's layout rules (`.bb-panel` with its 900px minimum, the hero, the switches, the guide and pace aside) were removed from `brainBoosters.css`. `.bb-page` still carries the `--bb-*` variables for `BoosterGame`.
- **Verification.** Scenario `focus-boosters.mjs` checks both Focus pages, the booster pages, the redirect, the navs, 390/360px and dark mode. The booster scenarios (`brain-boosters.mjs`, `finger-follow.mjs`, `finger-follow-full-session.mjs`) now open each game's own page.
