# State machine, input, and copy

Rules functions are in [RULES.md](RULES.md). This file is how `game.js` drives them, and every string the page shows.

## Two locks

The rules phase is not the only lock. The page also keeps `busy` true for the whole animation of a move, undo, redo, turn hand-over, win, opening roll, or play-again flight. While `busy` is true the board ignores clicks, undo and redo return immediately (and play `denied` only when a die is selected and the rules would refuse), and the HUD disables both buttons. `refresh()` runs when `busy` flips so outlines and the overlay update.

`menuOpen` and `winOpen` also swallow board input. The rules dialog does not; it is modal on its own.

## Phase machine

```
PREGAME
  startGame(first) → PLAYER_TURN

PLAYER_TURN
  selectDie → DIE_SELECTED
  advanceTurn, only when this guild has no legal die → PLAYER_TURN (forfeit)

DIE_SELECTED
  deselectDie, only if path is empty → PLAYER_TURN
  selectDie of another own die, only if path is empty → DIE_SELECTED
  beginMove → DIE_MOVING
  undoStep, only if path is non-empty → DIE_SELECTED
  redoStep → DIE_MOVING (then the page calls finishMove)

DIE_MOVING
  applyStep, repeated → DIE_MOVING
  finishMove, steps left → DIE_SELECTED
  finishMove, steps spent → still DIE_MOVING, result 'turn-complete'
  completeTurn, steps spent → WIN if the mover filled the goal, else TRANSITION

TRANSITION
  advanceTurn → PLAYER_TURN

WIN
  terminal until resetGame → PREGAME
```

Illegal calls return `false` or `null` and leave the state alone. The page never calls `applyStep` with a direction that was not returned by `beginMove` or `redoStep`.

### Page sequences

**Opening.** Entrance animation (skipped when reduced motion is on). Then the start button enables. Click runs `rollForFirstPlayer()` with `Math.random`, tumbles the menu dice, then `startGame` + hide menu + flip the camera if it is not already on the winner’s side + banner “{Guild}’s move” / “Turn 1”.

**Click a reachable cell.** `beginMove`; for each direction `applyStep`, animate the arc, play `step`, punch the step counter, wait 0.02 s; announce the landing; `finishMove`. On `'continue'`, set the overlay reveal time to now. On `'turn-complete'`: if the die is not on E5, play the small settle hop; `completeTurn`; play the relic sequence when `bonus` is set; if the die is now in its goal, play `arrive` and a spark burst; if `winner`, celebrate and stop; else wait, `advanceTurn`, banner, and while `mustForfeit` play `forfeit`, toast, wait, and `advanceTurn` again.

**Undo.** `undoStep`, animate that reverse step, `undo` cue, punch the counter, refresh the reveal time. No `finishMove` (phase never left `DIE_SELECTED`).

**Redo.** `redoStep`, animate, `step` cue, then the same `afterRolls` path as a click.

**Play again.** Only from the win card. `resetGame` runs **before** the dice visually fly home, so the logical state is already the opening while meshes lerp. Camera returns to Moon’s side if needed. Menu comes back. Start button enables.

## Pointer

The board canvas receives pointer events. `pointerdown` records the point and unlocks audio. `pointerup` is a click only when the pointer moved **6 CSS pixels or less**. A longer drag orbits the camera and does not pick. `pointermove` updates hover unless `pointerType === 'touch'` (touch has no hover). `pointerleave` clears hover.

Picking is a ray from the camera:

1. Hit the die meshes (not their outline shells; the shells are children and the raycast is non-recursive). The mesh `userData.id` is the die.
2. Else intersect the plane `y = 0` and `worldToCell`.

Hover, only while not `busy`, menu and win are closed, and phase is `PLAYER_TURN` or `DIE_SELECTED`:

- A die lights up when it is the selected die or `canSelectDie`.
- A cell lights up only in `DIE_SELECTED` when it is in `selectionReach`.
- Entering a new cell plays `hover` (debounced to one event per 70 ms inside `audio.js` as well).
- A hovered unselected die lifts `0.07` and gets a bone outline at scale `1.12`. The selected die stays at lift 0 with its guild outline at scale `1.15`. Others use the ink outline at scale `1.09`.
- Cursor is `pointer` when a die or a legal cell is under it.

Click: a die goes through `clickDie`. A cell, when a die is selected and the cell is reachable, starts `moveTo`. Keyboard mode turns off.

## Keyboard

The board canvas is `tabindex="0"`, `role="application"`. Focus shows a dashed bone rectangle (`#stage-focus`).

Arrow keys use the camera azimuth `atan2` of the camera offset on XZ (`OrbitControls.getAzimuthalAngle`). “Up” is away from the camera. Screen right is `(cos θ, −sin θ)` and screen forward is `(−sin θ, −cos θ)` on `(x, z)`. The board direction with the greatest dot product wins.

| Azimuth | Up    | Right | Down  | Left  |
| ------- | ----- | ----- | ----- | ----- |
| 0       | NORTH | EAST  | SOUTH | WEST  |
| π or −π | SOUTH | WEST  | NORTH | EAST  |
| π/2     | WEST  | NORTH | EAST  | SOUTH |
| −π/2    | EAST  | SOUTH | WEST  | NORTH |

Azimuth `0.6` matches `0`. Azimuth `π − 0.6` matches `π`. `Enter` and `w` are not arrows.

On focus, keyboard mode turns on and the cursor is placed if empty: the selected die, else the first `canSelectDie` die in id order, else E5. Each new turn clears the cursor and reseats it if the board is focused.

Arrow: step the cursor one cell if in bounds, play `hover`, announce the cell, refresh. Enter or Space: if a die is on the cursor, `clickDie`; else if the cursor cell is reachable, `moveTo`; else `denied`. Escape drops the current pick via `clickDie` on it, when not `busy`.

Window keys, ignored while the rules dialog is open, the menu is open, the win card is open, or Alt is held:

| Keys                              | Action     |
| --------------------------------- | ---------- |
| `U`, Backspace, Ctrl/Cmd+Z        | Undo       |
| `R`, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z | Redo       |
| `?` (no modifier)                 | Open rules |

Undo and redo buttons call the same functions. The rules button, the help button, and a backdrop click on the dialog open or close it, with the `ui` cue.

## HUD behaviour

`renderHud` on every `refresh`:

- `documentElement.dataset.turn` is `"1"` or `"2"`. CSS swaps `--accent` to Moon or Ember.
- Turn medallion shows `turnNumber`.
- Each plate is `.active` when the phase is not `PREGAME` or `WIN` and it is that guild’s turn. Nine pips, the first `countInGoal` lit. Accessible name: `"{Guild} guild, {n} of 9 dice in the goal corner"` plus `", to move"` when active.
- Dock drops `data-idle` while a die is selected.
- Step readout is the remaining count, or an en dash `–` (U+2013) when nothing is selected.
- Budget line: `of {stepBudget}` when a die is selected; `waiting` in `PREGAME`; `pick a die` otherwise.
- Top chip: `TOP {n}` or `TOP —` (em dash U+2014).
- Undo / redo disabled when `busy` or the matching `can*` is false.

Hint HTML (the step count and cell names are live):

| Situation                        | Hint                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| `PREGAME`                        | `Roll for the first move to begin.`                             |
| `WIN`                            | empty                                                           |
| `busy` and phase is `DIE_MOVING` | `Rolling…`                                                      |
| `busy` otherwise (not selected)  | empty                                                           |
| `PLAYER_TURN`                    | `Pick a glowing {Guild} die — its top face is your step count.` |
| Steps left, nowhere to go        | `Path blocked — undo to backtrack, then continue.`              |
| Hover or keyboard plan           | `Roll to {label} · {n} step` or `steps`                         |
| Selected, path empty, no plan    | `Roll to any lit cell, or pick the die again to drop it.`       |
| Selected, path non-empty         | `{n} step(s) left — keep rolling, or undo to backtrack.`        |

`{Guild}` is wrapped in `<b>`. After the entrance, the hint is forced to the pregame sentence even if `renderHud` has not run yet.

Announcements go to `#announcer` (`aria-live="polite"`). The node is cleared and set on the next frame so assistive tech notices repeats.

| Event        | Announcement                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Pick         | `{Guild} die at {label} picked: {n} step(s).`                                                                                 |
| Drop         | `Pick dropped.`                                                                                                               |
| Land         | `Rolled to {label}, top face {n}. {k} step(s) left.`                                                                          |
| Undo         | `Undone. {k} steps left.`                                                                                                     |
| Cursor moved | `{label}: {Guild} die showing {top}` plus `, picked` if selected; or `{label}: reachable in {n} step(s)`; or `{label}: empty` |
| Turn banner  | `{Guild}'s move. Turn {n}.`                                                                                                   |
| Opening      | `{Guild} moves first. Turn 1.`                                                                                                |
| Forfeit      | `{Guild} has no die free to move. The turn passes.`                                                                           |
| Relic        | `Relic! The die turns to six.`                                                                                                |
| Win          | `{Guild} wins on turn {n}!`                                                                                                   |

The turn-banner announcement uses a straight apostrophe. The visible banner title uses U+2019: `{Guild}’s move`.

Toasts (`role="status"`, default 1900 ms, easing `steps(12, end)`):

| Text                                                               | Duration |
| ------------------------------------------------------------------ | -------- |
| `Boxed in — pick a die with a free side.`                          | 1900     |
| `This die has already rolled — undo back to switch dice.`          | 1900     |
| `That is an {Owner} die — it is {Current}’s turn.`                 | 1500     |
| `{Guild} has no die free to move — the turn passes.`               | 2200     |
| `Sound off` / `Sound on`                                           | 1100     |
| `Reduced motion on` / `Full motion on`                             | 1100     |
| `The graphics context was lost — reload the page to keep playing.` | 6000     |

Banner subtitle is `Turn {n}` (opening uses the literal `Turn 1`). Relic caption, static in the HTML, is `Relic of Six`.

Win card, filled when the celebration finishes:

- kicker stays `The tournament is decided`
- title `{Guild} wins`
- subtitle `All nine dice reached the far corner on turn {n}.`
- button `Play again` takes focus

Opening roll line, after each tumble:

```
Moon rolled {m} · Ember rolled {e} — a tie, rolling again…
Moon rolled {m} · Ember rolled {e} — {Guild} moves first
```

During the tumble the line is `Rolling…`. The deciding line waits 1.1 s; a tie waits 0.7 s. The first tumble lasts 1.0 s, later tumbles 0.8 s. Faces flicker through random 1–6 twelve times across the tumble, then snap to the real rolls. Reduced motion skips the CSS tumble and still sets the final faces.

## Static copy

From `index.html`. Keep the punctuation.

- Title: `Dice Corners — The Midnight Tournament`
- Description: `Dice Corners — a midnight tournament of rolling dice. Roll all nine of your dice into the far corner.`
- Kicker: `✦ A midnight tournament of rolling dice ✦`
- Wordmark: `Dice Corners`
- Tagline: `Two guilds, eighteen dice, one worn star-table. Roll all nine of yours into the far corner — every roll turns up a new number.`
- Versus: `Moon Guild`, `vs`, `Ember Guild`
- Primary button (disabled until the entrance finishes): `Roll for first move`
- Loading: `Setting the table…` (hidden once `data-boot="ready"`)
- Secondary: `How to play`
- Footnote: `Prefer the original?` link text `Play the classic table` → `./classic.html`
- Plates: `Moon` / `guild`, `Ember` / `guild`
- Medallion label: `Turn`
- Dock: `steps left`, buttons `Undo` and `Redo`, initial hint `The table is being set…`
- Board help (screen-reader only): `Arrow keys move the board cursor. Enter or Space picks the die under the cursor, or rolls the picked die to the highlighted cell. U undoes a roll, R redoes it, Escape drops the pick.`
- Failure title: `The table is dark`
- Failure body: `Dice Corners could not start in this browser. Reload the page, or try an up-to-date version of Chrome, Firefox, Safari or Edge.`
- The detail line is the exception message, or `Could not load {src} or a module it imports` when the module script itself 404s.

Rules dialog:

1. `Guilds take turns. On your turn, pick one of your dice: the number on top is how many steps it must roll.`
2. `Tap any lit cell and the die rolls there by the shortest path. Every roll tips it over, so the top number changes as it goes.`
3. `Rolls are orthogonal, and dice never pass through or land on other dice. You may stop partway and keep going; Undo and Redo step back and forth within the turn.`
4. `The turn ends the moment the steps run out. End a turn on the golden relic in the centre and that die turns to show 6.`
5. `Win by filling the opposite corner — the one marked with your sigil — with all nine of your dice.`
6. `A guild with no die free to move forfeits its turn automatically.`

Controls in the dialog:

| Term                 | Text                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| Tap / click          | `Pick a die, tap it again to drop it, tap a lit cell to roll there.` |
| Drag · pinch · wheel | `Orbit and zoom the table. Drag the little die to inspect it.`       |
| arrows, Enter        | `Move the board cursor, pick or roll (focus the board first).`       |
| U R Esc              | `Undo, redo, drop the pick.`                                         |
| Close                | `Back to the table`                                                  |

Accessible names not visible as text: board `Dice Corners board`, app `Dice Corners`, settings group `Settings`, sound button toggles between `Sound on — mute` and `Sound off — turn sound on`, motion button `Reduce motion`, help `How to play`, undo `Undo roll`, redo `Redo roll`, preview `Picked die preview`. Plates get the computed aria-label above.

## Preferences and boot

Before first paint, `data-motion` is `reduced` when `localStorage['dice-corners:motion'] === 'reduced'`, or when that key is missing and `prefers-reduced-motion: reduce` matches. Otherwise `full`. `data-turn` starts as `1`. `data-boot` starts as `loading`.

| Key                   | Values                        |
| --------------------- | ----------------------------- |
| `dice-corners:muted`  | `'1'` muted, anything else on |
| `dice-corners:motion` | `'reduced'` or `'full'`       |

`localStorage` failures are ignored. The sound button’s `aria-pressed` is true when sound is **on**.

Boot chooses the Canvas 2D renderer when the query `renderer=software` is set or `webgl2` cannot be created. If WebGL construction throws, it retries once in software. If that throws, `data-boot="failed"` and the failure card shows `error.message`. A module load error does the same. `data-renderer` is `webgl2` or `software` after a successful start.

`window.__DICE_CORNERS__` (non-enumerable) exposes `version` `"2.0.0"`, `getState`, `getDiagnostics`, `cellToScreen`, `dieToScreen`, `whenIdle`. With `?test=1` it also exposes `skipPregame(player)` / `startWithPlayer`, which waits out the entrance and calls `beginPlay(player, true)` with no banner. Ports do not need this debug surface.

Reduced motion (`data-motion="reduced"`) forces CSS transitions and animations to 0.01 ms and takes the short timings in [PRESENTATION.md](PRESENTATION.md). It does not change rules.
