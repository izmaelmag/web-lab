# Platform mapping and milestones

Build the rules module until the vectors in [RULES.md](RULES.md) pass, then the scene, then input, then juice. Do not start from the shaders.

## Godot 4

Suggested layout. GDScript or C# are both fine; keep the rules in a `RefCounted` with no scene-tree calls so the vectors can run headless.

| Web                              | Godot                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game-logic.js`                  | `rules/dice_rules.gd` (or C#). Same names for phases, directions, and the public functions.                                                                                                                                                                                                                                                                                         |
| `view-math.js`                   | `rules/dice_view.gd`. `roll_pose`, `fit_board`, `arrow_to_direction`, `pixel_scale`.                                                                                                                                                                                                                                                                                                |
| Scene in `game.js`               | `scenes/table.tscn`: `Node3D` root, `WorldEnvironment`, `DirectionalLight3D` ×2, `OmniLight3D` for the relic, `Camera3D`.                                                                                                                                                                                                                                                           |
| Tiles                            | `MultiMeshInstance3D`, 81 instances, `BoxMesh` `0.94 × 0.12 × 0.94`.                                                                                                                                                                                                                                                                                                                |
| Dice                             | `MeshInstance3D` with six materials, textures from `textures/die-face-*.png`. Do not map `die-atlas-*.png` onto a stock `BoxMesh`; the atlas UV formula is in PRESENTATION.md.                                                                                                                                                                                                      |
| Rails, table, well, gems, decals | `MeshInstance3D` each, transforms from PRESENTATION.md.                                                                                                                                                                                                                                                                                                                             |
| Overlay                          | `MeshInstance3D` quad with `overlay.gdshader`, a `ImageTexture` `FORMAT_RGBA8` 9×9, filter nearest.                                                                                                                                                                                                                                                                                 |
| Sky                              | `sky.gdshader` on a `Sky`, or a large back-face sphere. Shader source is SHADERS.md.                                                                                                                                                                                                                                                                                                |
| Sparks                           | `GPUParticles3D` in the amounts from PRESENTATION.md, or a small pool of quads. Colours are the burst tables, not a sprite sheet.                                                                                                                                                                                                                                                   |
| HUD                              | `CanvasLayer` of `Control`s. Copy from STATE-AND-INPUT.md. Fonts from `assets/dice-corners/fonts/`.                                                                                                                                                                                                                                                                                 |
| Audio                            | `AudioStreamPlayer` per cue, streams from `audio/`. Import: loop off, normalise off. One player is enough if cues do not overlap; `step` can overlap the next `step` only after the 0.02 s gap, so a single player is safe. `bonus` then `step-0-last` do overlap: use two players. `rattle` and the opening `step` overlap: two players. `arrive` and `win` overlap: two players.  |
| Camera                           | `Camera3D` perspective FOV 42. A script copies `fit_board` into position and `h_offset` / `v_offset`. Orbit with the polar clamp 20–70° and the zoom clamp. Flip by adding π to yaw over 0.9 s, `inOutQuad`.                                                                                                                                                                        |
| Pixel look                       | Viewport stretch `viewport`, texture filter `Nearest` on the materials that set `filter: false`. The web also uses linear mipmaps on dice and tiles. Godot cannot split mag and min the same way. Prefer nearest (filter off) so pips stay crisp. Generate mipmaps only where the manifest says `mipmaps: true`, and accept that they will be nearest too. sRGB on colour textures. |
| Toon                             | A spatial shader that samples `toon-gradient.png` at `NdotL * 0.5 + 0.5` with nearest filtering, multiplied by the albedo. Lights from PRESENTATION.md.                                                                                                                                                                                                                             |

Import hints in the manifest are the contract: `filter`, `mipmaps`, `repeat: clamp`, `srgb`, `anisotropy`, and for audio `loop`, `loopBegin`, `loopEnd`, `normalize`.

Project settings worth matching: clear colour `#07050b`, default environment ambient from the hemisphere approximation if you do not author both lights, tonemap linear or AgX as long as the toon ramp still bands (the web bands in the shader, before three.js colour space output). Shadow atlas 1024 on the high tier, 512 on balanced, off on low. A quality menu can expose the three WebGL tiers; the software tiers are a web fallback and are not required.

## iOS

Swift. Keep `DiceRules` as a value type or a reference type with no UIKit imports, fed by the same vectors (an XCTest bundle that asserts the tables in RULES.md).

| Concern        | Approach                                                                                                                                                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Board          | SceneKit (`SCNScene`) is enough: boxes, a floor, lights, a camera, and `SCNAction` or a display-link for `rollPose`. Metal is warranted only if the sky and overlay shaders need to be pixel-identical; SceneKit `SCNProgram` can host the GLSL from SHADERS.md with small precision edits (`texture2D` → `texture`, `gl_FragColor` → output). |
| HUD            | SwiftUI over the `SCNView`, or UIKit. Dynamic type is not how this UI works: sizes are the CSS pixels in PRESENTATION.md. Honour the safe area the way the web uses `env(safe-area-inset-*)`. Minimum control size 44 pt.                                                                                                                      |
| Pixel scale    | Render the SceneKit view into a smaller drawable (`choosePixelScale`) and upscale with `magnificationFilter = .nearest`, or set `SCNScene.antialiasingMode` off and sample textures nearest. Do not enable MSAA.                                                                                                                               |
| Input          | `UITapGestureRecognizer` with a 6 pt movement threshold against the orbit pan. A drag orbits. Hover does not exist; the keyboard cursor is for hardware keyboards (`UIKeyCommand` or `pressesBegan`): arrows, Return, Space, U, R, Escape.                                                                                                     |
| Camera         | `SCNCamera` `yFov` 42 (or `xFov` if you match the web’s vertical FOV; the web FOV is vertical). Field of view is vertical in three.js.                                                                                                                                                                                                         |
| Audio          | `AVAudioPlayer` or `AVAudioEngine` with the WAVs. Category `.ambient` so the mute switch is respected, matching a browser that stays silent until a gesture. Do not add a reverb node. Unlock on the first tap the way the web unlocks the context.                                                                                            |
| Haptics        | Not in the web game. Do not add them as part of a faithful port.                                                                                                                                                                                                                                                                               |
| Reduced motion | `UIAccessibility.isReduceMotionEnabled`, overridable by a button persisted in `UserDefaults` under the same meanings as `dice-corners:motion`.                                                                                                                                                                                                 |
| Fallback       | No WebGL path. If SceneKit fails to build the scene, show the failure copy from STATE-AND-INPUT.md.                                                                                                                                                                                                                                            |
| Classic        | A link or button to the classic rules is a web footnote. Native builds do not need to embed `classic.html`.                                                                                                                                                                                                                                    |

Portrait must frame the board inside the HUD bands. The worked fit in PRESENTATION.md has portrait distance about 1.63× landscape for that safe rect; the test requirement is `> 1.5×`.

## Milestones

Each milestone is shippable on its own. Acceptance is checkable without looking at the web source. “Vectors” means the tables and worked examples in RULES.md and PRESENTATION.md.

### M1 — Rules

Port the phase record, quaternions, reachability, selection, move, undo, redo, centre bonus, win, forfeit, opening roll, and reset.

Acceptance:

- Identity and the four single rolls match the quaternion and top-face table.
- The six-roll worked sequence matches faces and components to 6 decimal places.
- `initialQuat` for tops 1–6 and both guilds matches the component tables within `1e-9`.
- Ember’s face toward −Z equals Moon’s face toward +Z for every top.
- 24 orientations; opposites sum to 7; four rolls restore; opposite roll undoes.
- Opening replay `0.5, 0.5, 0.99, 0` yields `[[4,4],[6,1]]`, Moon first.
- Starting layout, stuck set, and empty centre match.
- G3 budget 3 to G6 is three NORTHs, tops 3 → 2 → 4 → 5, and the turn completes.
- Partial move then continue, lock, illegal `applyStep`, undo, and redo match the worked turns.
- Centre sets canonical 6 only when the turn ends there. Crossing does not.
- Win fires only for the mover when the ninth die enters. The not-a-win vector stays in `TRANSITION`.
- The forfeit vector returns `mustForfeit` then hands back to Moon on turn 3.
- Fresh states are independent. `resetGame` restores a fresh state in place.

### M2 — Static table

Load the PNGs with the manifest’s sampling. Place tiles, rails, well, table, gems, sigils, relic, and the 18 dice in their starting orientations under the Moon camera (azimuth 0, polar `atan2(8.6, 10.5)`, distance from `fit_board`).

Acceptance:

- A1 is at world `(0, 0.425, 8)` for the die centre. I9 is `(8, 0.425, 0)`. E5 is `(4, …, 4)`.
- Moon dice show the starting tops. Ember dice show the starting tops and face their own edge.
- Pips are crisp (nearest). The ace on Moon is blue on ivory; Ember pips are bone-gold on garnet.
- Rails read A–I along the Moon edge and 1–9 up the west edge, upright from that guild’s seat.
- Moon sigil sits on Ember’s home; Ember sigil sits on Moon’s home.
- No shadow acne on the dice at the documented bias.

### M3 — Play

Wire picking, hover or keyboard cursor, the HUD, undo, redo, and the phase sequences in STATE-AND-INPUT.md. Camera may stay put until M4.

Acceptance:

- The G3 budget-3 turn can be played by clicking, and by keyboard from azimuth 0 (Up is NORTH).
- Undo and redo match the worked example, including the lock after the first roll.
- Stuck, opponent, and locked clicks produce the exact toasts.
- Hint strings match the table, including the en dash and the em dash.
- Opening roll uses the copy `Moon rolled {m} · Ember rolled {e} — …` and rerolls ties.
- A scripted win shows `{Guild} wins` and the turn count. Play again returns to the menu with dice home and Moon notionally first.
- Forfeit toast and announcement match, and a mutual seal does not invent a draw (it may loop; see open question 1).

### M4 — Motion and camera

`rollPose`, flip, entrance, bonus, reduced motion.

Acceptance:

- The NORTH arc from `(4, 0.425, 4)` passes through `(4, 0.601040764009, 3.5)` at t = 0.5 and lands on `(4, 0.425, 3)`.
- Full-motion roll is 0.26 s linear. Reduced is 0.12 s.
- Flip is 0.9 s `inOutQuad` and adds π to the current azimuth. Arrow keys follow the new azimuth (the π row of the table).
- Bonus lift peaks at 1.25 and the die ends on canonical 6. Reduced bonus lift peaks at 0.5 with no extra spin.
- Portrait fitted distance is greater than 1.5× landscape for the same HUD safe rect. Ember’s azimuth uses the same distance and the same vertical shift as Moon’s.
- Reduced motion skips the entrance, the screen shake, and the win hop.

### M5 — HUD, type, accessibility

Acceptance:

- Every static string in STATE-AND-INPUT.md is present, including the six rules and the failure card.
- Jacquard 24 for the wordmark, Pixelify Sans for UI, Silkscreen for labels. Licences travel with the app (the OFL files).
- Controls are at least 44 pt. Focus is visible. The board has an accessible description of the keys.
- Turn changes announce `{Guild}'s move. Turn {n}.` on a polite live region.
- Sound and motion persist across launches. Sound starts unmuted unless the stored flag is set. Motion starts reduced when the OS asks and the user has not chosen.
- Safe areas keep the HUD off the notch and the home indicator.

### M6 — Audio

Acceptance:

- Each row of the cue table in AUDIO.md plays the named WAV at that moment, once.
- The relic plays `bonus.wav` and then `step-0-last.wav`.
- A goal arrival plays `arrive.wav`. A win plays `arrive.wav` then `win-*.wav`.
- Opening ties play `rattle.wav` once per pair, then the scale `step`.
- Hover is gated at 70 ms.
- Mute silences within a short ramp and survives relaunch. No extra reverb. Files are not normalised on import.
- Output is stereo 48 kHz as authored. Do not resample in a way that changes pitch.

### M7 — Shaders and juice

Acceptance:

- Reachable cells, path, hover, origin, trail, cursor, and movable ticks match the flag bits and the colours in SHADERS.md. The current guild’s goal dashes march; the other goal is dimmer.
- The centre ring is gold and dims while a die stands on E5.
- Sky gradients from `#050309` under the horizon to `#0c0818` overhead, with a dithered nebula and stars that freeze when motion is reduced.
- Toon stops match the four-byte ramp. Key, rim, hemisphere, and relic lights match PRESENTATION.md.
- Sparks use the burst table. High tier may emit the full counts; balanced and low scale them by 0.6 and 0.35.
- Shadows exist on high (1024) and balanced (512) and disappear on low, along with the relic point light.

### M8 — Device matrix

Acceptance:

- A phone portrait and a desktop landscape both keep the whole frame, including the rails, inside the safe rect, with the dock and the header clear of the board.
- A keyboard on iPad plays a full turn.
- The web fallback is unchanged: this milestone does not edit `static/dice-corners/` except for the optional audio parameters already used by the exporter.
- `npx vitest run`, `npm run lint`, `npm run check`, and `npm run build` still pass for the web tree.

## Out of scope unless the owner asks

Online multiplayer, a computer opponent, a draw, haptics, a chamfered die, and replacing the pixel art with a smooth render.
