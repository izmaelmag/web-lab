# IzmaelMag header

Read from `src/lib/components/Intro/Intro.svelte`, `JumpText.svelte`, `WigglyText.svelte` in `/Users/izm/web-lab`. Not checked against a live replay.

## Composition

Azeret Mono on black. Name 72px weight 900 in `#ff9913`, initials I and M at 96px white, baseline-aligned. Portrait 180px circle, 4px orange border. Text block shifted left 32px so the name cuts into the circle. First initial nudged right 6px, name pulled left 8px, black `text-shadow` above and below the I to cut it from the circle. Greeting 20px/500 at 0.8 opacity, translated (59px, 31px) into the gap above the lowercase. Subtitle 16px/300, 0.03em tracking, tucked up 6px.

## Score

Seconds from each element's own start. `end = start + (N - 1) * stagger + duration`, spaces count.

| Element | Start | N | Stagger | Dur | Travel | End |
|---|---|---|---|---|---|---|
| Circle zoom 0.2 to 1 | 0 | | | 0.50 | | 0.50 |
| Portrait rise, rotate 35deg, pivot bottom-left | 0.20 | | | 0.80 | 100% | 1.00 |
| "Hello there!" | 0 | 12 | 0.05 | 0.50 | 150% up | 1.05 |
| "crafting" | 0 | 8 | 0.05 | 0.50 | 100% down | 0.85 |
| "moving pixels" fade | 0.25 | | | 1.00 | | 1.25 |
| I, M | 0.50 | 1 | | 0.50 | 50% down | 1.00 |
| "with code" | 1.00 | 9 | 0.05 | 0.35 | 100% down | 1.75 |
| "zmael" | 1.15 | 5 | 0.10 | 0.50 | 50% down | 2.05 |
| "ag" | 1.40 | 2 | 0.10 | 0.50 | 50% down | 2.00 |

Initials land as a pair. Both orange runs finish 50ms apart despite 5 vs 2 letters.

## Mechanics

- **Jump.** Per-letter span, from `translate(0, offset) scale(0.8) rotate(-60deg * rotationScale)` and opacity 0 to neutral. Curve `cubic-bezier(0.37, 1.69, 0.17, 0.8)`, fill `both`. "Up" means starts below.
- **Portrait.** Circle and photo share `cubic-bezier(1, 0.55, 0.3, 1)`. The crop hides the photo's approach.
- **Wiggle.** X span wraps Y span. Keyframes 0, 0.5, 1, -0.5, -1, 0 at 20% steps, ease-in-out, infinite. Base 5s, 1px X, 3px Y. Each value scaled by a sin-hash of index and salt within ±10%. Y delay adds a quarter of its period. Stagger 0.01s.
- **Compact "Home".** Stagger 0.025, rotationScale 0.1 (-6deg). Expressive motion dialed down for a repeated control.

## Weaknesses to fix in new work

- Letters start at opacity 0 and need JS mount. No reduced-motion branch.
- Name is `div`s, not a heading. WigglyText splits UTF-16 units and uses `{@html}`.
- Mobile uses `scale(0.6)` and a 140vw subtitle. Layout box unchanged.
- One `text-shadow` has four lengths and is invalid.
- Permanent `will-change` and `preserve-3d` on every letter.
- Portrait and wiggle run on CSS load. Jump waits for mount. No shared clock.
