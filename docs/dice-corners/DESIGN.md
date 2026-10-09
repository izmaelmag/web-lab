# Dice Corners — design capture

This is a specification of the **current** web game (version `2.0.0`), taken from the code in `static/dice-corners/` and the tests in `src/lib/dice-corners/`. It is written so a coding agent can rebuild the game on another engine without reading the JavaScript. Where the code is silent or two live values disagree, the item is listed under [Open questions](#open-questions) instead of being invented.

The rules module is the authority for play. The page is the authority for everything a player sees and hears. `classic.html` is the previous table; its rules match, its presentation does not. A port of the live game follows the current presentation.

## What the game is

Dice Corners is a local hot-seat race for two guilds on a 9×9 board. Each guild has nine dice. On your turn you pick one of your dice; the number on top is how many orthogonal steps that die must roll. Every step tips the die onto a new face. You win by standing all nine of your dice in the opponent’s 3×3 home corner. Ending a turn on the centre cell turns that die to 6.

There is no computer opponent, no network play, and no draw rule.

The tone is a **midnight tournament**: a worn star-chart table floating in a dithered plum void, ivory Moon dice against garnet Ember dice, gold relic, pixel type, and a short hall on every cue. Copy is grave and plain, not jokey.

## Target platforms

| Platform | This capture                                                                | Rebuild target                                                                                                                                           |
| -------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web      | The live game at `/dice-corners` (`index.html` + ES modules, three.js r185) | Already shipped. Do not change it to match a port.                                                                                                       |
| Godot 4  | Textures, cues, and font files under `assets/dice-corners/`                 | Scenes and GDScript or C# as in [PLATFORMS.md](PLATFORMS.md). Shaders in [SHADERS.md](SHADERS.md).                                                       |
| iOS      | Same assets                                                                 | Swift, with SceneKit or Metal for the board and SwiftUI or UIKit for the HUD. SpriteKit is a poor fit: the board is a lit 3D table with an orbit camera. |

## How to read this pack

| Document                                 | Contents                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [RULES.md](RULES.md)                     | Board, dice, rotation, movement, win, classic differences, test vectors, self-play stress policy |
| [STATE-AND-INPUT.md](STATE-AND-INPUT.md) | State record, phase machine, pointer and keyboard, HUD copy                                      |
| [PRESENTATION.md](PRESENTATION.md)       | Scene, camera, light, materials, motion, pixel scale, palette, glyphs                            |
| [AUDIO.md](AUDIO.md)                     | Every cue: synthesis, when it fires, which WAV to play                                           |
| [SHADERS.md](SHADERS.md)                 | Sky, route overlay, and spark GLSL, plus the toon and point-light contract                       |
| [PLATFORMS.md](PLATFORMS.md)             | Godot and iOS mapping, milestones, acceptance criteria                                           |
| [ASSETS.md](ASSETS.md)                   | Manifest, fonts, what was not exported                                                           |
| `assets/dice-corners/manifest.json`      | File list, sizes, seeds, Godot import hints                                                      |

Implement rules first and lock them with the vectors in RULES.md before building a scene. The web tests are the oracle if a JS runtime is available; the vectors are the portable subset.

## Source map

| Concern                                 | File                                           |
| --------------------------------------- | ---------------------------------------------- |
| Rules, quaternions, reachability, turns | `static/dice-corners/game-logic.js`            |
| Camera framing, roll arc, pixel scale   | `static/dice-corners/view-math.js`             |
| Scene, input, HUD, motion               | `static/dice-corners/game.js`                  |
| Pixel textures                          | `static/dice-corners/textures.js`              |
| Synthesis                               | `static/dice-corners/audio.js`                 |
| GLSL                                    | `static/dice-corners/game.js` (shader strings) |
| CPU shader ports and Canvas 2D fallback | `soft-shaders.js`, `soft-renderer.js`          |
| Page, CSS variables, static copy        | `static/dice-corners/index.html`               |
| Previous presentation                   | `static/dice-corners/classic.html`             |
| Rules tests                             | `src/lib/dice-corners/*.test.ts`               |

`audio.js` accepts an optional `context` and `random` so `npm run export:dice-assets` can render cues offline. The game calls `createAudio({ muted })` only. With those arguments omitted, playback is the gesture-unlocked `AudioContext` and `Math.random` path.

## Player-facing summary

Moon (player 1) starts in the corner at columns G–I, rows 1–3. Ember (player 2) starts in columns A–C, rows 7–9. Moon’s goal is Ember’s corner, marked with the Moon sigil. Ember’s goal is Moon’s corner, marked with the Ember sigil. The golden relic sits on E5, the centre.

A match opens on a menu. The player presses **Roll for first move**. Each guild rolls a d6; the higher roll moves first; ties roll again. The camera then sits behind the guild to move. After every completed turn the camera swings half a turn and the other guild plays. A guild with no die that has a free orthogonal neighbour forfeits. Filling the goal corner wins.

## Open questions

These are gaps or disagreements in the current tree. Do not invent a resolution inside a port unless the product owner picks one. Default to reproducing the current behaviour, including the rough edges.

1. **No draw.** If both guilds are sealed (neither has a legal die), `advanceTurn` alternates forever and the page keeps playing forfeit banners. The rules never declare a draw. Reproduce the loop, or stop and ask before adding a draw.
2. **Two mist colours.** CSS `--mist` is `#b3a4c4` and is what the HUD uses. `PALETTE.mist` in `textures.js` is `#a898b8` and is never sampled. Use the CSS value for UI. Do not invent a scene use for the unused constant.
3. **Seventh scale note.** `audio.js` lists seven pentatonic frequencies, but a die has at most six steps, so index 6 (`523.25` Hz) never plays. Keep the array if you port the synthesis; do not add a seventh step.
4. **Classic chamfer.** `classic.html` sets `DIE_CHAMFER: 0.07` and a `SPRING` string and never reads them. Current dice are plain boxes of size `0.85`. Do not chamfer them.
5. **Camera after a free orbit.** The end-of-turn flip adds π to the current azimuth. It does not snap back to the canonical behind-the-guild angle. Arrow keys follow the live azimuth. That is the behaviour.
6. **Unseeded juice.** Spark directions, the opening-roll face flicker, and the win-burst timing use `Math.random`. Rules and textures do not. Ports may seed juice; they must not seed the opening d6 unless a test harness asks for it.
7. **Bit-exact WAV.** Cues are rendered in Chrome (the version is in `manifest.json`) through `OfflineAudioContext`. Another Chrome build can differ by a sample. The committed WAVs are the assets to ship; the script is how to regenerate them.
