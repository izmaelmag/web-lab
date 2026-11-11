# Audio

All cues are synthesised in `audio.js`. Nothing is streamed from a file at runtime on the web. The export in `assets/dice-corners/audio/` is the same graph, rendered offline, so a port plays WAVs instead of rebuilding oscillators. Do not put those WAVs through another reverb or a normaliser: the hall and the master level are already in the file.

## Graph

No `AudioContext` exists until `unlock()`, which the page calls from a pointer or key handler. If construction fails, every cue is silent.

```
oscillators and noise → per-cue envelope → master gain
                                              → dynamics compressor → destination
                         envelope → send gain → convolver → master
```

| Node        | Value                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Master      | `0.7`, or `0` while muted. Mute ramps with `setTargetAtTime`, time constant `0.02`.                                                |
| Compressor  | threshold `−14` dB. Other parameters stay at the Web Audio defaults.                                                               |
| Reverb send | wet gain `0.28` into the convolver                                                                                                 |
| Impulse     | stereo, `floor(sampleRate * 1.6)` frames. Sample `i` is `(random()*2 − 1) * (1 − i/length)^3`. A new context builds a new impulse. |

`live()` is null while muted or, on the real page, while the context is not `running`. Cues scheduled before unlock are dropped, not queued.

### Primitives

`tone(freq, duration, { type, gain, when, glide, reverb })` defaults: sine, gain `0.12`, when `0`, glide `0`, reverb send `0.3`.

```
osc.type = type
osc.frequency at t: freq
if glide ≠ 0: exponential ramp to max(20, freq * glide) over duration
envelope: 0.0001 at t → gain at t+0.006 → 0.0001 at t+duration
osc stops at t + duration + 0.02
dry to master; if reverb ≠ 0, a send of that gain into the wet node
```

`noise(duration, { gain, when, freq, q, type, sweep })` defaults: gain `0.1`, freq `1800`, Q `1.2`, bandpass, sweep `0`. One-shot buffer of `max(1, floor(sampleRate * duration))` samples, each `(random()*2 − 1) * (1 − i/length)`. Filter frequency ramps exponentially to `sweep` when `sweep ≠ 0`. The noise does **not** go to the reverb. Gain is constant (no extra envelope).

`jitter()` is `0.94 + random()*0.12`. On the web, `random` is `Math.random`. In the export, it is mulberry32 (see the manifest).

`clack(weight)`:

```
noise 0.05 s, gain 0.16*weight, freq 1900*jitter, Q 1.4
tone 150*jitter Hz, 0.10 s, sine, gain 0.20*weight, glide 0.5, reverb 0.1
tone 2600 Hz, 0.012 s, square, gain 0.02*weight, reverb 0
```

Pentatonic `SCALE` in Hz: `220, 261.63, 293.66, 329.63, 392, 440, 523.25`. A turn uses index `min(stepIndex, 6)` where `stepIndex` is 0-based and at most 5, because a die has at most six steps. `523.25` is never played (open question 3).

## When each cue fires

| Method           | WAV                 | Fires                                                                                                                                                                         |
| ---------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`             | `ui.wav`            | Rules open/close, sound toggle, motion toggle, start, play again. Also the click that begins those.                                                                           |
| `hover`          | `hover.wav`         | Pointer entered a new reachable cell, or the keyboard cursor stepped. Dropped if the previous hover was under 70 ms ago (`performance.now`).                                  |
| `select(1)`      | `select-moon.wav`   | Moon die picked (`clickDie` → `selected`).                                                                                                                                    |
| `select(2)`      | `select-ember.wav`  | Ember die picked.                                                                                                                                                             |
| `deselect`       | `deselect.wav`      | Pick dropped before any roll.                                                                                                                                                 |
| `step(i, false)` | `step-{i}.wav`      | A committed forward roll that does not spend the last step. `i = path.length − 1` after `applyStep`.                                                                          |
| `step(i, true)`  | `step-{i}-last.wav` | The roll that leaves `stepsRemaining === 0`. Also played once at the end of the relic animation (`step(0, true)`), on top of the rolls that got there.                        |
| `undo`           | `undo.wav`          | After the reverse roll animates.                                                                                                                                              |
| `denied`         | `denied.wav`        | Stuck die, locked die, undo/redo when refused while a die is selected, keyboard activate on an empty illegal cell.                                                            |
| `turn(1)`        | `turn-moon.wav`     | Banner for Moon, including the opening if Moon won the roll.                                                                                                                  |
| `turn(2)`        | `turn-ember.wav`    | Banner for Ember.                                                                                                                                                             |
| `forfeit`        | `forfeit.wav`       | A guild receives a turn and has no legal die.                                                                                                                                 |
| `arrive`         | `arrive.wav`        | `completeTurn` finished and the moved die is standing in its goal. Not played on a win-only path before the win cue; it is played first, then `win` if that arrival also won. |
| `bonus`          | `bonus.wav`         | Centre relic sequence starts.                                                                                                                                                 |
| `rattle`         | `rattle.wav`        | Once per opening pair, including ties, as the menu dice tumble.                                                                                                               |
| `win(1)`         | `win-moon.wav`      | Moon’s celebration starts.                                                                                                                                                    |
| `win(2)`         | `win-ember.wav`     | Ember’s celebration starts.                                                                                                                                                   |

Opening, after each tumble settles, the page also plays `step(max(moon, ember) − 1, false)`. That is a scale ping on top of the rattle, not a board roll.

`select`, `step`, `undo`, and `rattle` depend on `jitter` and noise, so the export includes three takes. The unsuffixed file is seed `0xD1CE` (53710). `-v2` is that seed plus 1, `-v3` plus 2. Play the unsuffixed file. The variants exist so a port can pick one and stay there; do not randomise per event unless you want the web’s unseeded behaviour. Other cues are a single take because their only randomness is the reverb impulse, which the seed fixes.

Hover is quiet and short. The web may play it many times a second, subject to the 70 ms gate. A port should keep that gate.

## Synthesis of each cue

Times are seconds from the call. Types and gains are the arguments, not including the master 0.7.

| Cue             | Events                                                                                                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`            | square 1320 Hz, 0.05 s, gain 0.025, reverb 0                                                                                                                                                                                                                                                                                                |
| `hover`         | sine 1900 Hz, 0.025 s, gain 0.02, reverb 0                                                                                                                                                                                                                                                                                                  |
| `select` Moon   | `clack(0.6)`; triangle 659.25 Hz, 0.35 s, gain 0.07, at 0.02 s; sine 987.77 Hz, 0.45 s, gain 0.05, at 0.07 s                                                                                                                                                                                                                                |
| `select` Ember  | `clack(0.6)`; triangle 440 Hz, 0.35 s, gain 0.07, at 0.02 s; sine 659.25 Hz, 0.45 s, gain 0.05, at 0.07 s                                                                                                                                                                                                                                   |
| `deselect`      | triangle 520 Hz, 0.12 s, gain 0.05, glide 0.6                                                                                                                                                                                                                                                                                               |
| `step` not last | `clack(0.9)`; triangle `SCALE[i] * 2`, 0.22 s, gain 0.05                                                                                                                                                                                                                                                                                    |
| `step` last     | `clack(1.2)`; triangle `SCALE[i] * 2`, 0.50 s, gain 0.08; sine `SCALE[i] * 3`, 0.60 s, gain 0.04, at 0.05 s                                                                                                                                                                                                                                 |
| `undo`          | `clack(0.7)`; triangle 480 Hz, 0.18 s, gain 0.05, glide 0.7                                                                                                                                                                                                                                                                                 |
| `denied`        | square 110 Hz, 0.14 s, gain 0.05, reverb 0; square 104 Hz, 0.14 s, gain 0.04, at 0.07 s, reverb 0                                                                                                                                                                                                                                           |
| `turn` Moon     | noise 0.6 s, gain 0.06, bandpass 320 → sweep 2400, Q 0.8; sine 329.63 Hz, 0.6 s, gain 0.08, at 0.25 s, reverb 0.6; sine 493.88 Hz, 0.9 s, gain 0.07, at 0.45 s, reverb 0.6                                                                                                                                                                  |
| `turn` Ember    | same noise; triangle 220 Hz then 329.63 Hz, same times and gains, reverb 0.6                                                                                                                                                                                                                                                                |
| `forfeit`       | sine 98 Hz, 1.4 s, gain 0.12, reverb 0.7; triangle 147 Hz, 1.1 s, gain 0.04, at 0.05 s, reverb 0.7                                                                                                                                                                                                                                          |
| `arrive`        | sine 1046.5 Hz and 1318.5 Hz, each 0.4 s, gain 0.04, the second at 0.06 s, reverb 0.5                                                                                                                                                                                                                                                       |
| `bonus`         | 523.25, 659.25, 783.99, 1046.5, 1318.5 Hz, each 0.55 s, gain 0.08, every 0.07 s, type triangle/sine/triangle/sine/triangle, reverb 0.7; plus highpass noise 0.9 s, gain 0.04, freq 5000, Q 0.5                                                                                                                                              |
| `rattle`        | 6 hits. Hit `i` at `i * 0.11 + random()*0.04`: noise 0.04 s gain 0.1 at `2000*jitter`, and sine `170*jitter` Hz, 0.06 s, gain 0.08, glide 0.6, reverb 0                                                                                                                                                                                     |
| `win`           | Root 392 Hz for Moon, 329.63 Hz for Ember. Four chords at 0, 0.26, 0.52, 0.78 s. Ratios `[1, 1.25, 1.5]`, `[1.333, 1.667, 2]`, `[1.5, 1.875, 2.25]`, `[2, 2.5, 3]`. Triangle, gain 0.06, reverb 0.6. The last chord lasts 1.4 s; the earlier chords last 0.36 s. Plus lowpass noise bursts at those four times, 0.12 s, gain 0.1, freq 180. |

## Files

48 kHz, stereo, 16-bit PCM, little-endian WAV. The renderer trims trailing samples whose absolute value is at or below `1/32768`, then keeps 50 ms. Godot: loop off, no loop points, **normalise off**. Durations and peaks are in `manifest.json`. Peaks are small (the `ui` take peaks near `0.004`) because the master and compressor are in the bounce. Play them at unity on a bus that is not quieter than the rest of the game.

Regenerate with `npm run export:dice-assets` (Chrome, `CHROME_PATH` optional). The committed files are the ones to ship.
