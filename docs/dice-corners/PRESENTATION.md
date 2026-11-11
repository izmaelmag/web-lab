# Presentation

Numbers are in world units unless noted. The board centre is `(4, 0, 4)`. Die size `0.85`, cell size `1`, resting die centre height `0.425`.

## Pixel scale and quality

The canvas is drawn into a low-resolution buffer and scaled up with CSS `image-rendering: pixelated` / `crisp-edges`. `renderer.setPixelRatio(1)`. Antialiasing is off.

```
dpr = min(devicePixelRatio or 1, 3)
cellCssPx = viewportHeight / (2 * fittedDistance * tan(FOV/2))
pixelScale = clamp(round(cellCssPx * dpr / pixelTarget), 1, maxScale)
buffer = round(viewportCss * dpr / pixelScale)
```

`maxScale` is 6 on WebGL and 12 on the software renderer. `choosePixelScale` vectors, default target 30 and max 6:

| Input                     | Scale |
| ------------------------- | ----- |
| cell 60 CSS px, dpr 1     | 2     |
| cell 38, dpr 3            | 4     |
| cell 60, dpr 1, target 20 | 3     |
| cell 20, dpr 1            | 1     |
| cell 0, dpr 2             | 1     |
| cell 400, dpr 2           | 6     |
| cell 400, dpr 2, max 3    | 3     |

WebGL tiers, in order. A coarse pointer (`pointer: coarse`) starts on **balanced**. Otherwise start on **high**. The software path has its own two tiers and always starts on the first, even on a coarse pointer.

| Name         | Shadow map | Art px / cell | Particle scale | Relic point light |
| ------------ | ---------- | ------------- | -------------- | ----------------- |
| high         | 1024       | 30            | 1              | on                |
| balanced     | 512        | 26            | 0.6            | on                |
| low          | off        | 22            | 0.35           | off               |
| software     | off        | 22            | 0.6            | on                |
| software-low | off        | 17            | 0.35           | on                |

The governor never steps back up. It ignores samples `≤ 0` or `> 250` ms. Otherwise it keeps an exponential moving average with weight `0.05`. After 90 accepted frames, if the average exceeds 26 ms and a lower tier exists, it drops one tier and resets the window. Vectors: 16.7 ms forever stays at 0; 40 ms × 89 stays, the 90th sample drops to 1, another 90 drops to 2, further 40 ms samples stay at 2; a 30-frame burst of 40 ms followed by fast frames stays at 0; 1200 ms, NaN, and negative samples are ignored.

Frame `dt` is clamped to `0..0.1` seconds. Fog near/far are refit whenever the camera distance changes by more than 2%.

## Camera

Perspective, FOV 42°, near 0.1, far 500. Polar angle is fixed at `atan2(8.6, 10.5)` ≈ 39.319° (classic “10.5 up, 8.6 back”) for the **fit**. The live orbit may change polar between 20° and 70°.

`fitBoardView` binary-searches the smallest orbit distance in `(0.5, 1000)` over 64 steps such that the board box fits the HUD safe rectangle. The box is `x,z ∈ [−5.35, 5.35]` (tiles at ±4.5 plus the frame) and `y ∈ [−0.62, 0.9]`, camera looking at the board centre with three.js spherical coordinates. The returned `shiftX` / `shiftY` are NDC offsets that centre that box in the safe rect, applied with `setViewOffset`.

Safe rect from the live HUD, in NDC: top is just under the header (at most 40% of the height), bottom is just above the dock (at least 60% of the height), sides are `min(16 px, 3% of width)`.

Worked fit with safe rect `left −0.9, right 0.9, bottom −0.55, top 0.72`, polar as above, azimuth 0, half-extent 5.35, y range `[−0.62, 0.9]`:

| View                   | Distance  | shiftX | shiftY   |
| ---------------------- | --------- | ------ | -------- |
| aspect 16/9            | 19.417634 | 0      | 0.165178 |
| aspect 9/16            | 31.616558 | 0      | 0.111851 |
| aspect 9/16, azimuth π | 31.616558 | 0      | 0.111851 |

Zoom limits are `0.55×` and `1.5×` the fitted distance. Orbit: no pan, damping `0.08`, zoom speed `0.9`, rotate speed `0.8`, target `(4,0,4)`.

Initial camera: distance 15 at azimuth 0 (behind Moon, +Z), then `layout()` may pull it to the fitted distance. `cameraSide()` is Moon when `cos(azimuth) ≥ 0`, else Ember.

End-of-turn flip: take the current offset from the centre, keep its horizontal radius and height, add `π * ease` to `atan2(z, x)` over 0.9 s with `inOutQuad` (0 s if reduced motion or `instant`). Controls are disabled during the flip. This is 0.9 s, not the classic 0.8 s.

Fog colour `#07050b`. Before the first layout, near 24 and far 64. After layout, near = `fittedDistance + 3`, far = `fittedDistance + 42`. The sky ignores fog.

## Scene

Draw order roughly back to front:

| Object       | Geometry                                                              | Transform                             | Material                                                |
| ------------ | --------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Sky          | Sphere radius 160, 32×16, back side, no depth write, render order −10 | centred on `(4,0,4)`                  | Sky shader                                              |
| Table        | Circle radius 15, 72 segments                                         | `y = −0.62`, rotation x `−π/2`        | Toon, `table.png`, nearest, no mipmaps, receives shadow |
| Well         | Box `9 × 0.5 × 9`                                                     | `(4, −0.37, 4)`                       | Toon colour `#0a060e`, receives shadow                  |
| Tiles        | 81 instances of box `0.94 × 0.12 × 0.94`                              | centre on each cell, `y = −0.06`      | Toon, `tile-atlas.png`, instance colour below           |
| Rails        | Four boxes, height 0.7                                                | see below, `y = −0.25`                | Sides `#160e1d`; top is the rail PNG                    |
| Corner gems  | Octahedron radius 0.19, scale y 1.35                                  | `y = 0.24` at the four rail corners   | Toon, colours below                                     |
| Sigil decals | Plane 3×3                                                             | `y = 0.004`, rotation x `−π/2`        | Moon sigil at world `(1, _, 1)`, Ember at `(7, _, 7)`   |
| Relic seal   | Plane 0.94                                                            | on E5, `y = 0.004`                    | `relic-seal.png`                                        |
| Relic gem    | Octahedron radius 0.17, scale y 1.7                                   | rest `y = 0.64` on E5                 | Toon `#ffc857`, emissive `#7a4a10`                      |
| Relic pillar | Open cylinder radius 0.44, height 5, 20 sides                         | `(4, 2.5, 4)`, hidden until the bonus | Additive `#ffc857`, opacity animated                    |
| Shockwave    | Ring inner 0.42 outer 0.5, 48 segments                                | on E5, `y = 0.02`, rotation x `−π/2`  | Additive `#ffc857`                                      |
| Overlay      | Plane 9×9, render order 2                                             | `(4, 0.008, 4)`, rotation x `−π/2`    | Overlay shader, additive                                |
| Sparks       | Up to 420 points, render order 5                                      | —                                     | Spark shader, additive                                  |
| Dice         | Box 0.85, plus a back-face shell                                      | rest on their cell                    | Face atlas; shell scale below                           |

Rails (length × width along the board, then the box is `(sizeX, 0.7, sizeZ)`):

| Rail       | Box `(x, z)` size | Position `(x, z)` | Texture               |
| ---------- | ----------------- | ----------------- | --------------------- |
| Moon edge  | 10.7 × 0.85       | `(4, 8.925)`      | `rail-moon-edge.png`  |
| Ember edge | 10.7 × 0.85       | `(4, −0.925)`     | `rail-ember-edge.png` |
| West       | 0.85 × 9          | `(−0.925, 4)`     | `rail-west.png`       |
| East       | 0.85 × 9          | `(8.925, 4)`      | `rail-east.png`       |

Corner gems, positions `(x, z)`, colour, emissive:

| Corner             | Colour    | Emissive  | Meaning                           |
| ------------------ | --------- | --------- | --------------------------------- |
| `(−0.925, −0.925)` | `#9fd4ff` | `#1d4a7a` | Moon’s goal corner (Ember’s home) |
| `(8.925, 8.925)`   | `#ff7a45` | `#6a1d0c` | Ember’s goal corner (Moon’s home) |
| `(−0.925, 8.925)`  | `#3a2850` | black     | Unused corner                     |
| `(8.925, −0.925)`  | `#3a2850` | black     | Unused corner                     |

Decals use `alphaTest` 0.5, no depth write, polygon offset −2. Board sigils are the 192×192 PNGs (96 art pixels, nearest ×2). HUD sigils are the 24 and 32 PNGs, drawn with fill `#1d1429`; the board sigils have no fill.

### Tiles

Atlas UV: `uv * 0.5 + atlasOffset`. Variant `0..3` is `floor(seeded(2718)() * 4)` per cell in index order `i = row * 9 + col`. Offset x is `(variant % 2) * 0.5`. Offset y is `0.5` when `variant < 2`, else `0` (three.js UV origin is the bottom of the texture, so variants 0 and 1 are the top row of the painted atlas).

Instance colour, linear RGB via `Color.setRGB`:

```
light = ((col + row) % 2 === 0) ? 1 : 0.8
jitter = 0.94 + seeded(2718)() * 0.1     // second draw from the same generator, after the variant draw
rgb = (light * jitter, light * jitter * 0.97, light * jitter)
```

The checker is subtle (1.0 vs 0.8), not a chessboard of two paints. The atlas itself already contains four worn stones.

### Dice materials

One draw per die. The box UVs are rewritten so the six faces share one atlas. Three.js `BoxGeometry` vertex order is groups of 4 in slot order `[+X, −X, +Y, −Y, +Z, −Z]`. Slot `s` lands in atlas cell `col = s % 3`, `row = floor(s / 3)`:

```
u' = (col + u) / 3
v' = 1 - (row + 1) / 2 + v / 2
```

Groups are cleared so a single material is used. Slot values are `FACE_ORDER` `[3, 4, 1, 6, 2, 5]`. Godot’s `BoxMesh` face order is not this order. Prefer the twelve individual face PNGs and assign them by the local normals in RULES.md, or rebuild this UV map explicitly. Do not assume a stock box matches the atlas.

Outline shell: `MeshBasicMaterial`, `BackSide`, child of the die.

| State               | Colour    | Scale |
| ------------------- | --------- | ----- |
| Idle                | `#07050b` | 1.09  |
| Hover, not selected | `#efe6d2` | 1.12  |
| Selected Moon       | `#9fd4ff` | 1.15  |
| Selected Ember      | `#ff7a45` | 1.15  |

Preview canvas (the dock) uses a second renderer of the same family, alpha true, FOV 30, camera `(1.75, 1.55, 2.2)` looking at the origin, orbit without zoom or pan, rotate speed 0.9. The shown die’s quaternion is `yaw(−azimuth) * boardDie.quaternion`, so it stays readable as the table camera orbits. Shell scale 1.07. If that renderer fails, the game continues without a preview. Lights: hemisphere `#b9aee0` / `#1a0f14` intensity 1.6, and a white directional intensity 2.2 from `(1.5, 4, 2.5)`.

Die mesh pose, after the logical rest position is in `base`:

```
position = (base.x + shakeX,
            base.y + lift + drop - (1 - squash) * 0.425,
            base.z)
scale = (1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5)
```

## Lights

| Light           | Colour                          | Intensity     | Notes                                                                                                                                                  |
| --------------- | ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hemisphere      | sky `#9a8ad0`, ground `#160c18` | 1.35          |                                                                                                                                                        |
| Key directional | `#e8e6ff`                       | 2.5           | from `(−1, 14, 12)`, target centre. Shadow ortho ±7.5, near 2, far 40, bias −0.0008, normal bias 0.02. PCF. Casts only when the tier has a shadow map. |
| Rim directional | `#ff9a6a`                       | 0.7           | from `(13, 5, −5)`, no shadow                                                                                                                          |
| Relic point     | `#ffc857`                       | 3.2, animated | position `(4, 0.9, 4)`, range 4.2, decay 2. Hidden on the WebGL `low` tier.                                                                            |

Toon ramp: 4×1, bytes `88, 150, 206, 255`, nearest. Sample coordinate `NdotL * 0.5 + 0.5`, index `floor(coord * 4)` clamped to `0..3`.

| NdotL | Stop    |
| ----- | ------- |
| −1    | 88/255  |
| −0.2  | 150/255 |
| 0.2   | 206/255 |
| 1     | 255/255 |

Point-light falloff (three.js `getDistanceAttenuation`):

```
falloff = 1 / max(distance ^ decay, 0.01)
if cutoff > 0:
  k = saturate(1 - (distance / cutoff) ^ 4)
  falloff *= k * k
```

`(distance 2, cutoff 0, decay 2) = 0.25`. At `distance ≥ cutoff` with cutoff 4.2 the smooth term is 0. The software renderer’s no-ramp fallback (`coord < 0.7 ? 0.7 : 1`) is not used on the WebGL path.

Anisotropy of sampled textures is `min(4, device max)` on WebGL and 1 on software. Mag filter is nearest. Min filter is linear-mipmap-linear except the table, which is nearest and has no mipmaps. Colour space sRGB on canvases.

## Relic idle

Each frame, `relicHeight` eases toward `1.45` when a die occupies E5 and toward `0.64` otherwise, with factor `min(1, dt * 3)`. Display height adds `sin(time * 1.6) * 0.05` unless reduced motion. Yaw increases by `dt * 0.9` unless reduced motion. The overlay’s relic strength eases toward `0.25` when E5 is occupied and `1` otherwise, same factor. Point-light intensity is `(occupied ? 1.2 : 3.2) + sin(time * 2) * 0.4`, and the sine term is 0 under reduced motion. The gem is hidden until 60% of the entrance.

## Overlay data

A 9×9 RGBA buffer, one texel per cell, index `(row * 9 + col) * 4`. Nearest, no mipmaps. Do not flip it: texel `(col, row)` is board `(col, row)`, and board row 0 is high world Z. See [SHADERS.md](SHADERS.md).

| Channel | Byte     | Meaning                                                |
| ------- | -------- | ------------------------------------------------------ |
| R       | distance | 0 if not a reachable target, else BFS `dist` (`1..6`)  |
| G       | flags    | bitfield below                                         |
| B       | links    | which edges of the preview path touch this cell        |
| A       | order    | 1-based index of the preview step that enters the cell |

Flags: `TRAIL = 1`, `ORIGIN = 2`, `HOVER = 4`, `PATH = 8`, `CURSOR = 16`, `MOVABLE = 32`.

Links: `NORTH = 1`, `SOUTH = 2`, `EAST = 4`, `WEST = 8`. A preview step writes the travel direction on the source cell and the opposite on the destination, and flags both `PATH`. The destination also gets `HOVER`. Reachable distances are written only in `DIE_SELECTED` when not `busy`. `MOVABLE` is written on every `canSelectDie` cell in `PLAYER_TURN` when not `busy`. `TRAIL` and `ORIGIN` follow the rules helpers. `CURSOR` is the keyboard cursor while keyboard mode is on and the phase is a picking phase.

Goal rectangles in overlay space `(minCol, minRow, maxCol+1, maxRow+1)`: the current guild’s goal is `uGoalA` (full strength, marching dashes), the opponent’s goal is `uGoalB` (dim, static). During `PREGAME`, `uGoalStrength` is 0.55; otherwise 1. Accent and goal colours follow the guild to move.

## Sparks

Pool of 420. A burst requests `round(count * particleScale * (reducedMotion ? 0.35 : 1))` dead particles (at least 1). Each gets a random horizontal angle, speed `speed * (0.35..1)`, upward `up * (0.5..1.3)`, life `life * (0.6..1.2)`, size `size * (0.7..1.3)`, and a colour from the list cycling. Position jitters by `spread`. Integration: gravity on `vy`, horizontal drag `vx *= 1 - 1.8 dt` (same for `vz`), `y` clamped to `≥ 0.02`. Alpha `min(1, life/max * 1.6)`, size scaled by `0.5 + 0.5 * life/max`. Point size on screen is `max(1, floor(aSize * uScale / depth))` with `uScale = bufferHeight / (2 * tan(FOV/2))`.

| Moment            | Count                   | Colours                         | speed | up  | life | size | gravity | spread |
| ----------------- | ----------------------- | ------------------------------- | ----- | --- | ---- | ---- | ------- | ------ |
| Land              | 6                       | `#8a7aa6`, `#efe6d2`            | 1.1   | 0.7 | 0.45 | 0.07 | 4       | 0.6    |
| Select            | 12                      | guild colour, `#efe6d2`         | 1.8   | 1.1 | 0.55 | 0.08 | 4       | 0.7    |
| Relic, at t > 0.5 | 60                      | `#ffc857`, `#fff0c2`, `#ff9a3c` | 3     | 2.4 | 1.1  | 0.1  | 3       | 0.15   |
| Goal arrival      | 18                      | guild, `#efe6d2`                | 1.6   | 2   | 0.8  | 0.09 | 4       | 0.15   |
| Entrance land     | 4                       | `#6f5a8c`                       | 0.8   | 0.5 | 0.4  | 0.06 | 4       | 0.15   |
| Win, full motion  | 14, about 35% of frames | guild, `#efe6d2`, `#ffc857`     | 3.2   | 2   | 1.4  | 0.1  | 2.5     | 3      |
| Win, reduced      | 40 once at centre       | same                            | 2     | 1   | 1.2  | 0.09 | 4       | 0.15   |

## Motion

Easing:

```
linear(t) = t
outCubic(t) = 1 - (1 - t)^3
inOutQuad(t) = t < 0.5 ? 2 t^2 : 1 - (2 - 2t)^2 / 2
inOutSine(t) = -(cos(π t) - 1) / 2
outBack(t) = 1 + 2.4 (t-1)^3 + 1.4 (t-1)^2
outBounce: standard easeOutBounce with n = 7.5625, d = 2.75
```

Durations in seconds. “Reduced” is `data-motion="reduced"`.

| Clip                           | Full                                                                               | Reduced                     | Ease                           |
| ------------------------------ | ---------------------------------------------------------------------------------- | --------------------------- | ------------------------------ |
| One roll                       | 0.26                                                                               | 0.12                        | linear along `rollPose`        |
| Landing squash                 | 0.14, amplitude 0.07                                                               | 0                           | `sin(π t)`                     |
| Select squash                  | 0.34                                                                               | 0                           | `sin(2π t) * exp(−4 t) * 0.16` |
| Lift to a target               | 0.12                                                                               | 0                           | outCubic                       |
| Denied shake                   | 0.28, `sin(6π t) * (1−t) * 0.06` on x                                              | 0                           | linear                         |
| End-of-turn settle (not on E5) | 0.2, lift `sin(π t) * 0.06`                                                        | 0                           | linear                         |
| Relic bonus                    | 0.95, lift `sin(π t) * 1.25`, extra yaw `(1−t) * 4π` while slerping to canonical 6 | 0.5, lift 0.5, no extra yaw | inOutSine                      |
| Shockwave after bonus          | 0.5, scale `1 → 4.2`, opacity `(1−e)*0.8`                                          | 0                           | outCubic                       |
| Relic caption                  | 1.5                                                                                | 1.5 (opacity only)          | ease-out                       |
| Camera flip                    | 0.9                                                                                | 0                           | inOutQuad                      |
| Turn banner                    | 1.45                                                                               | 1.0                         | `cubic-bezier(.2,.8,.2,1)`     |
| Gap between rolls of one click | 0.02                                                                               | 0.02                        | —                              |
| Pause before hand-over         | 0.15                                                                               | 0.05                        | —                              |
| Forfeit reading time           | 1.2                                                                                | 0.8                         | —                              |
| Win hop                        | 1.4                                                                                | sparks only                 | see below                      |
| Win card fade                  | 0.5                                                                                | 0.001                       | linear                         |
| Menu fade                      | 0.38                                                                               | 0.001                       | linear                         |
| Play-again flight              | 1.1                                                                                | 0                           | per-die inOutQuad              |
| Entrance                       | 2.0                                                                                | skipped                     | below                          |
| Step-counter punch             | 0.28, or 0.42 on the last step                                                     | brightness only             | ease-out                       |
| Screen shake                   | 0.22, `steps(4)`                                                                   | skipped                     | —                              |

Bonus pillar opacity peaks at `sin(π t) * 0.35`, scale y from 0.3 to 1. A land plays `step` and a shake of strength 4. A normal turn-end shakes strength 2.

Win hop, full motion: each of the winner’s dice uses delay `hypot(x − cornerX, z − cornerZ) * 0.07` and a 0.55 window inside the 1.4 s. Lift is `abs(sin(local * 2π)) * 0.35` while the sine is positive. Moon’s corner anchor is `(−0.5, −0.5)`; Ember’s is `(8.5, 8.5)`. Sparks emit near `(corner + (±1.5, 2.5, ±1.5))` with the sign toward the board.

Play again: die `i` delays `(i % 9) * 0.03`, local window 0.7 inside 1.1 s, position lerps with `inOutQuad`, height adds `sin(π local) * 1.4`. Quaternion slerps to the fresh `initialQuat`.

Entrance: tiles delay `hypot(col−4, row−4) * 0.045`, rise over 0.5 s of the 2.0 s clock with `outBack` from `y = −0.96` to `−0.06`. Dice start `drop = 4`. Die `i` delays `0.55 + (i % 9) * 0.05 + (i ≥ 9 ? 0.18 : 0)` and falls with `outBounce` over 0.6 s. A spark fires when a die’s drop crosses from above 0.2 to 0. Both are forced to rest at the end.

Opening-roll CSS (when motion is full): the 3×3 pip grid rotates through `0 → −14° up 10 px → 10° up 4 px → −6° up 8 px → 0` over the tumble, easing `steps(10)`.

## Screen dressing

Fixed overlays, pointer-events none:

- Vignette: radial darkening to `rgb(4 2 8 / 0.75)` plus a 8% accent wash at the top. Background transition 0.6 s.
- Scanlines: 1 px black at 18% alpha, then 2 px clear, overall opacity 0.45.
- Grain: `grain.png` tiled at 128 CSS px, pixelated, opacity 0.5, `mix-blend-mode: overlay`.

Buttons are at least 44×44 CSS px, chunky inset highlights, press `translateY(2px)`, hover `translateY(−2px)` in `steps(2)`. Primary buttons are gold with ink text `#1a0f08`. Focus visible is a 3 px bone outline, offset 5 px. The board’s focus ring is a 3 px dashed bone inset.

Dock die card is 76×76 (56×56 when the viewport is shorter than 520 px and wider than 600 px). Plates max 280 px. The HUD respects `safe-area-inset`. Below 370 px width the goal pips hide.

## Palette

CSS custom properties (`index.html`). These are the HUD colours.

| Token        | Hex       | Token          | Hex       |
| ------------ | --------- | -------------- | --------- |
| `--void`     | `#07050b` | `--bone`       | `#efe6d2` |
| `--ink`      | `#0e0a14` | `--gold`       | `#ffc857` |
| `--plum-900` | `#150e1f` | `--gold-deep`  | `#8a5a1c` |
| `--plum-800` | `#1d1429` | `--moon`       | `#9fd4ff` |
| `--plum-700` | `#2a1d3a` | `--moon-deep`  | `#24508a` |
| `--plum-600` | `#3a2850` | `--ember`      | `#ff7a45` |
| `--plum-500` | `#54406e` | `--ember-deep` | `#a8322a` |
| `--plum-400` | `#735d91` | `--mist`       | `#b3a4c4` |

`--accent` is Moon until `data-turn="2"`, then Ember. Theme colour and the page background are `#07050b`. `color-scheme: dark`.

`textures.js` `PALETTE` matches those hexes except `mist`, which is `#a898b8` and unused (open question 2).

Guild paint on the dice (`GUILD_ART`):

| Role     | Moon      | Ember     |
| -------- | --------- | --------- |
| body     | `#ece2cc` | `#7a1c2b` |
| light    | `#fffaef` | `#a5343f` |
| dark     | `#b9ab90` | `#4a0f1a` |
| rim      | `#6f6553` | `#27060d` |
| speck    | `#dcd0b6` | `#6a1624` |
| pip      | `#1b1730` | `#ffd98f` |
| pipLight | `#4a4466` | `#fff3d3` |
| pipDark  | `#07060d` | `#b57a2c` |
| ace      | `#24508a` | `#ffc05a` |
| aceLight | `#5b8cc9` | `#fff0c4` |

Scene colours that are not in the CSS table:

| Use                                 | Hex                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Sky top / horizon / bottom / nebula | `#0c0818` / `#1c1030` / `#050309` / `#3a1f4a`                                  |
| Well                                | `#0a060e`                                                                      |
| Rail sides                          | `#160e1d`                                                                      |
| Key / rim / relic lights            | `#e8e6ff` / `#ff9a6a` / `#ffc857`                                              |
| Hemisphere sky / ground             | `#9a8ad0` / `#160c18`                                                          |
| Board sigil lines                   | Moon `#5d77b4`, Ember `#b8573a`, shade `#0b0712`                               |
| Engraved glyph ink / gold           | `#0b0710` shadow at (+1,+1), `#b08a4a` glyph                                   |
| Toon ramp                           | `#585858`, `#969696`, `#cecece`, `#ffffff` as the byte stops 88, 150, 206, 255 |

Stone, lacquer, and chart colours are baked into the PNGs. Do not re-roll them; the seeds are in [ASSETS.md](ASSETS.md).

## Coordinate glyphs

Rails engrave a 5×7 bitmap, centred, with a one-pixel shadow down-right. `flip` rotates the glyph 180°. Rows are top to bottom, `1` is ink. The alphabet used on the board is A–I and 1–9. B–H and the extra shapes exist in the font but are not engraved on the shipped rails.

```
A 01110 10001 10001 11111 10001 10001 10001
B 11110 10001 10001 11110 10001 10001 11110
C 01111 10000 10000 10000 10000 10000 01111
D 11110 10001 10001 10001 10001 10001 11110
E 11111 10000 10000 11110 10000 10000 11111
F 11111 10000 10000 11110 10000 10000 10000
G 01111 10000 10000 10011 10001 10001 01111
H 10001 10001 10001 11111 10001 10001 10001
I 11111 00100 00100 00100 00100 00100 11111
1 00100 01100 00100 00100 00100 00100 01110
2 01110 10001 00001 00110 01000 10000 11111
3 11110 00001 00001 01110 00001 00001 11110
4 00010 00110 01010 10010 11111 00010 00010
5 11111 10000 11110 00001 00001 10001 01110
6 00110 01000 10000 11110 10001 10001 01110
7 11111 00001 00010 00100 01000 01000 01000
8 01110 10001 10001 01110 10001 10001 01110
9 01110 10001 10001 01111 00001 00010 01100
```

Letter labels sit at along-rail offsets `1.35, 2.35, … 9.35` world units (then ×32 art pixels). Number labels sit at `8.5, 7.5, … 0.5` so rank 1 is at the Moon end of a vertical rail. The shipped PNGs already contain them.

## Die-face painting (already in the PNGs)

32×32 art, then nearest ×4. Body fill, 26 specks from `seeded(value * 97 + guild * 13)` in the inner 26 pixels, a 2 px light bevel on the top and left, a 2 px dark bevel on the bottom and right, and a 1 px rim. Pips are filled circles, radius 4.6 for the ace and 3.3 otherwise, centred on the 4×4 grid. The rim of a pip darkens when `d > radius − 1.1` and `dx + dy > 0.6`. A highlight hits when `dx + dy < −radius * 0.7`. Ace uses the ace colours; other values use pip colours.

## Software renderer

Web-only fallback when WebGL 2 is missing or `?renderer=software` is set. It rasterises the same scene graph in Canvas 2D, runs the JS ports of the sky and overlay shaders (`soft-shaders.js`), and skips shadow maps. Ports to Godot or iOS do not need a second rasteriser if their GPU shaders match SHADERS.md and the toon contract above. The web page must keep the fallback: it is what lets the game boot without WebGL 2.
