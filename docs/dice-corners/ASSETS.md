# Assets

Generated files live in `assets/dice-corners/`. `manifest.json` is the index: path, source function, pixel size or duration, intended use, and Godot import hints. Regenerate the PNGs and WAVs with:

```
npm run export:dice-assets
```

That runs `scripts/export-dice-assets.mjs`. It needs Google Chrome (`CHROME_PATH` overrides `/usr/local/bin/google-chrome`). It deletes and rewrites `textures/`, `audio/`, and `manifest.json`. It does not touch `fonts/`.

The capture that shipped with this document was rendered in the Chrome version recorded at `manifest.chrome`. Pixel canvases are nearest-neighbour `fillRect` / `putImageData` draws, so they should match another Chrome. WAVs go through `OfflineAudioContext` and can differ by a sample across Chrome builds. Treat the committed WAVs as the assets.

## Textures (29)

All filter nearest (`godot.filter: false`), clamp, sRGB. Mipmaps and anisotropy follow the manifest. The web mag filter is nearest; the web min filter is linear-mipmap-linear where `mipmaps` is true, and nearest where it is false. See PLATFORMS.md for the Godot compromise.

| File                                        | Pixels  | Source                                                                                                                |
| ------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `textures/die-face-{moon,ember}-{1..6}.png` | 128×128 | `dieFace(value, guild)`. 32×32 art, nearest ×4.                                                                       |
| `textures/die-atlas-{moon,ember}.png`       | 384×256 | Six faces, slots `[+X,−X,+Y,−Y,+Z,−Z]` = values `[3,4,1,6,2,5]`, 128×128 each.                                        |
| `textures/tile-atlas.png`                   | 256×256 | `tileAtlas()`. Four 32×32 stones, nearest ×4. Variant choice is **not** in this image; `game.js` uses `seeded(2718)`. |
| `textures/rail-moon-edge.png`               | 684×54  | `railTexture` seed 11, letters upright.                                                                               |
| `textures/rail-ember-edge.png`              | 684×54  | seed 12, letters flipped.                                                                                             |
| `textures/rail-west.png`                    | 54×576  | seed 13, ranks upright.                                                                                               |
| `textures/rail-east.png`                    | 54×576  | seed 14, ranks flipped.                                                                                               |
| `textures/sigil-moon-board.png`             | 192×192 | Moon crescent, line `#5d77b4`, shade `#0b0712`, 96 art px nearest ×2.                                                 |
| `textures/sigil-ember-board.png`            | 192×192 | Ember flame, line `#b8573a`, same shade.                                                                              |
| `textures/sigil-{moon,ember}-hud-24.png`    | 24×24   | HUD plates. Line is the guild colour, shade `#07050b`, fill `#1d1429`.                                                |
| `textures/sigil-{moon,ember}-hud-32.png`    | 32×32   | Menu, turn banner, win card. Same colours as the 24 px sigils.                                                        |
| `textures/relic-seal.png`                   | 128×128 | `relicSeal()`. 32 art px nearest ×4.                                                                                  |
| `textures/table.png`                        | 512×512 | `tableTexture()`, seed 7331. No mipmaps.                                                                              |
| `textures/grain.png`                        | 64×64   | `grainCanvas()`, seed 99. No mipmaps. CSS tiles it at 128 px.                                                         |
| `textures/toon-gradient.png`                | 4×1     | Bytes 88, 150, 206, 255 in R, G, and B. No mipmaps.                                                                   |

Seeds inside the painters: die specks `value * 97 + guild * 13`, tile variants in the atlas image `401 + variant * 31`, rails as above, table `7331`, grain `99`. Tile **placement** on the board uses a separate `seeded(2718)` in `game.js`.

## Audio (39)

48 kHz, stereo, 16-bit PCM. Canonical seed `0xD1CE` (53710). Variant files add 1 and 2 to that seed. Trim rule and the cue list are in [AUDIO.md](AUDIO.md). Godot: `loop: false`, `loopBegin: null`, `loopEnd: null`, `normalize: false`.

| Takes | Files                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One   | `ui`, `hover`, `deselect`, `step-1` … `step-4`, `step-0-last` … `step-4-last`, `denied`, `turn-moon`, `turn-ember`, `forfeit`, `arrive`, `bonus`, `win-moon`, `win-ember` |
| Three | `select-moon`, `select-ember`, `step-0`, `step-5-last`, `undo`, `rattle`                                                                                                  |

`step-5.wav` (not last) is a single take. Only the last-step form of degree 5 has variants, plus degree 0 not-last.

## Fonts

Vendored because the SIL Open Font License 1.1 allows bundling when the copyright and the licence travel with the files. Each family has its own `OFL.txt`. The web still loads them from Google Fonts; these copies are for Godot and iOS.

| Family        | Files                                                            | CSS use                                                                         | Copyright                                        |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Jacquard 24   | `fonts/jacquard-24/Jacquard24-Regular.ttf`                       | `--font-display`, the wordmark                                                  | Copyright 2023 The Soft Type Project Authors     |
| Pixelify Sans | `fonts/pixelify-sans/PixelifySans-wght.ttf`                      | `--font-ui`, weights 400–700. This is the upstream variable font (axis `wght`). | Copyright 2021 The Pixelify Sans Project Authors |
| Silkscreen    | `fonts/silkscreen/Silkscreen-Regular.ttf`, `Silkscreen-Bold.ttf` | `--font-label`. The page asks for weights 400 and 700.                          | Copyright 2001 The Silkscreen Project Authors    |

Upstream: `https://github.com/google/fonts` under `ofl/jacquard24`, `ofl/pixelifysans`, `ofl/silkscreen`. Licence FAQ: `https://openfontlicense.org`.

Fallbacks in the CSS, if a port cannot load a file: Jacquard → Pixelify Sans → `ui-serif`, Georgia, serif. Pixelify → `ui-monospace`, SF Mono, Menlo, Consolas. Silkscreen → Pixelify Sans → `ui-monospace`, Menlo.

## Not exported

| Thing                             | Why                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sky, route overlay, spark shaders | Procedural, animated, and dithered per pixel. GLSL is in [SHADERS.md](SHADERS.md). A still would miss the twinkle, the marching dashes, and the reveal. |
| Spark particles                   | Coloured points with velocities, not a sprite. Burst tables are in PRESENTATION.md.                                                                     |
| Opening-roll pips                 | CSS boxes, 3×3, lit from `PIP_LAYOUT`. Not a canvas.                                                                                                    |
| 5×7 glyphs as a separate sheet    | Baked into the rail PNGs. The bitmaps are in PRESENTATION.md so a port can engrave them again.                                                          |
| `PALETTE.mist` (`#a898b8`)        | Defined and never sampled. The HUD uses CSS `--mist` `#b3a4c4`.                                                                                         |

The software renderer’s nebula cubemap (48×48 per face) is an implementation cache of the sky shader, rebuilt from the same hash. It is not an art asset. Bake it in-engine from the shader if you need it.
