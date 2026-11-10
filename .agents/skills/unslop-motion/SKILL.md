---
name: unslop-motion
description: Cut generic tells from any web animation. Replaces linear, uniform, ragged motion with eased, choreographed motion that lands on one beat, written in compact CSS. Use when writing, reviewing, or fixing transitions, entrances, hovers, loaders, scroll or hero animation.
---

# Unslop motion

Rewrite motion so it feels designed: eased, layered, timed to land together, and built in as little CSS as possible.

## Process

1. Fix the settled frame first. Motion can't rescue a weak layout.
2. Give each moving element a role: lead, support, accent, or ambient. No role, no motion.
3. Pick a landing beat `L`. Write the score per group: delay, count, stagger, duration, travel, easing.
4. Implement in CSS with tokens and one or two shared keyframes. Reach for JS only when CSS can't express it.
5. Watch at 25% speed (DevTools Animations panel). Check entrance, exit, interruption, narrow width, reduced motion.
6. Self-audit: "What makes this look generated?" Fix it. Then: "What can I remove?" Remove it.

## Adding life

- **Ease into rest.** Entrances decelerate, exits accelerate, on-screen moves do both.
- **Layer properties.** Opacity finishes in about half the transform's time, so the element is solid while it settles.
- **Land together.** Groups converge on `L`. The accent (CTA, logo, initial) lands last, 80 to 150ms after.
- **Lead and follow.** Parent moves first, children trail by 30 to 60ms. Large elements travel less than small ones.
- **Overshoot sparingly.** One springy accent per scene. Everything else settles cleanly.
- **One thing stays alive.** After the entrance, at most one slow ambient loop.

## Tokens

```css
:root {
  --ease-out: cubic-bezier(.16, 1, .3, 1);      /* entrances */
  --ease-in: cubic-bezier(.7, 0, .84, 0);       /* exits */
  --ease-in-out: cubic-bezier(.65, 0, .35, 1);  /* moves on screen */
  --ease-back: cubic-bezier(.34, 1.56, .64, 1); /* one accent */
  --spring: linear(0, .12, .38, .66, .89, 1.04, 1.11, 1.13, 1.11, 1.07, 1.04, 1.01, .99, .99, .98, .99, .99, 1);
}
```

Durations: press and hover 100 to 160ms. Tooltip, dropdown 150 to 220ms. Modal, drawer 220 to 320ms. Hero items 500 to 800ms. Ambient loops 3 to 8s. Exit is about 70% of the entrance.

Travel: UI 4 to 16px, hero 24 to 60px or 30 to 150% of its own height. Scale starts at .95 to .98, never 0.

Timing: a group ends at `delay + (N - 1) * stagger + duration`. To land on `L`, set `delay = L - (N - 1) * stagger - duration`. Count spaces if they animate.

## Compact CSS

```css
.item {
  animation: fade var(--fd, .35s) linear both, rise var(--rd, .7s) var(--ease-out) both;
  animation-delay: calc(var(--d, 0ms) + var(--i, 0) * var(--step, 45ms));
}
@keyframes fade { from { opacity: 0 } }
@keyframes rise { from { translate: 0 var(--travel, 16px) } }
```

- `from`-only keyframes end at the element's own resting style.
- Use `translate`, `scale`, `rotate` properties. They compose without overwriting each other.
- Pass `--i`, `--d`, `--rd`, `--travel` per element or group. One rule serves every group.
- Height: transition `grid-template-rows: 0fr` to `1fr`. Entry from `display: none`: `@starting-style` plus `transition-behavior: allow-discrete`. Scroll: `animation-timeline: view()` inside `@supports`.
- Reduced motion: set `--travel: 0` and drop loops. Keep the fades.

## Patterns to detect and fix

### Easing

1. **Linear movement.** `linear` on position or scale reads as a machine. Use the tokens. Linear is for opacity, spin loops, progress bars, marquees.
2. **Default `ease` everywhere.** The browser default has no intent. Pick out, in, or in-out by direction.
3. **Wrong direction.** Ease-in on an entrance starts slow and slams to a stop. Entrances use ease-out.
4. **Bounce on everything.** Overshoot on every element is noise. Keep it for one accent.

### Timing

5. **One duration for all.** Hover, modal, and hero share 300ms. Scale duration to distance and size.
6. **Sluggish UI.** Hover over 200ms, menus over 300ms feel laggy. Cut them.
7. **Everything at once.** No hierarchy. Stagger by role: lead, support, accent.
8. **Endless stagger.** 20 items at 100ms take 2 seconds. Use 30 to 60ms, cap spread near 400ms with `min(var(--i), 8)`.
9. **Ragged finish.** Groups end whenever their length dictates. Solve delays from `L`.
10. **Queue, not phrase.** Each group waits for the previous to finish. Overlap them by 30 to 60%.
11. **Symmetric exit.** Exit replays the entrance. Make it shorter, ease-in, less travel.

### Movement

12. **Fade only.** Opacity alone looks flat. Add 8 to 16px of travel or a .97 scale.
13. **Too far, too big.** 100px slides and scale from 0. Shrink travel, start scale near 1.
14. **Wrong origin.** Popovers grow from center. Set `transform-origin` to the trigger.
15. **Ambient spam.** Several infinite loops compete. Keep one, slow, small.

### Code

16. **`transition: all`.** Animates things you didn't mean to. List properties.
17. **Layout properties.** `top`, `left`, `width`, `height`, `max-height: 999px` cause jank and wrong timing. Use transforms and the grid height trick.
18. **JS for a CSS job.** `setTimeout` chains, rAF hovers, a library for a fade. Use `animation-delay`, transitions, `:hover`, `@starting-style`.
19. **Keyframe per element.** `fadeIn1`, `fadeIn2`, `slideUpDelay3`. One keyframe, custom properties.
20. **Keyframes for state.** Toggles built from `@keyframes` jump when interrupted. Use transitions for reversible state.
21. **`will-change` everywhere.** Permanent layer hints waste memory. Add only after measuring jank.
22. **Hidden without JS.** Content waits at `opacity: 0` for a mount class. Let CSS run it, or make the settled state the default.

## Honesty

Label values as measured, read from source, or proposed. Don't claim you watched motion you only read.

`references/header-analysis.md` is a worked example of hero typography.
