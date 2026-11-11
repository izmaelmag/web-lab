# Shaders

The sky, the route overlay, and the sparks are animated per pixel. They are not baked. The strings below are the author source from `static/dice-corners/game.js` (three.js r185). Copy them as written. `soft-shaders.js` is a line-by-line CPU port of the sky and the overlay for the Canvas 2D fallback; it reads the same uniform objects and emits linear light, the colour the GLSL has before `#include <colorspace_fragment>`. `src/lib/dice-corners/soft-shaders.test.ts` locks that port. A Godot or iOS build does not need the CPU port if its GPU shaders match this file.

## What three.js adds

`ShaderMaterial` compiles these strings with three’s usual prefixes: `precision highp float`, the built-in matrices, and `#include <colorspace_pars_fragment>`. The author strings are not standalone GLSL until the include is replaced.

`renderer.outputColorSpace` is `SRGBColorSpace` and the working space is linear sRGB, so the include becomes:

```glsl
vec4 sRGBTransferOETF(vec4 value) {
  return vec4(mix(pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), value.rgb * 12.92, vec3(lessThanEqual(value.rgb, vec3(0.0031308)))), value.a);
}
vec4 linearToOutputTexel(vec4 value) {
  return sRGBTransferOETF(value);
}
// replaces: #include <colorspace_fragment>
gl_FragColor = linearToOutputTexel(gl_FragColor);
```

The encoding matrix from linear-sRGB primaries to sRGB primaries is identity in this build. Tone mapping is three’s default (no extra curve on these materials). Do the encode in the fragment shader, then blend. Encoding after additive blending changes the glow.

`MeshToonMaterial` (dice, tiles, rails, table, well, relic) is three’s stock toon shader plus the ramp below. It is fogged. The custom shaders are not: `ShaderMaterial.fog` defaults to false, and the sky sets `fog: false` as well. Fog on the toon meshes is linear, colour `#07050b`, near 24, far 64.

## Blend state

Overlay and sparks:

| State       | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| Blending    | `AdditiveBlending`, `premultipliedAlpha` false                          |
| Equation    | add                                                                     |
| Factors     | `SRC_ALPHA, ONE` for RGB and `ONE, ONE` for alpha (`blendFuncSeparate`) |
| Depth write | off                                                                     |
| Depth test  | on (default)                                                            |
| Transparent | true                                                                    |

Both shaders write alpha `1.0`. The spark fade is already multiplied into RGB (`vColor * vAlpha`), so the add is `framebuffer += encodedRGB`. Godot `blend_add` (`SRC_COLOR, ONE`) matches that. Overlay render order 2, sparks render order 5, sky render order −10 with depth write off and `BackSide`.

## Toon ramp and point light

Not a custom shader. `MeshToonMaterial.gradientMap` is `textures/toon-gradient.png`: 4×1, nearest, bytes `88, 150, 206, 255` in the red channel (the export repeats them in G and B). three.js samples it at `NdotL * 0.5 + 0.5`.

| NdotL | Stop    |
| ----- | ------- |
| −1    | 88/255  |
| −0.2  | 150/255 |
| 0.2   | 206/255 |
| 1     | 255/255 |

The relic is the only point light: colour `#ffc857`, decay `2`, distance (cutoff) `4.2`, position `(4, 0.9, 4)`. Intensity is `(occupied ? 1.2 : 3.2) + sin(time * 2) * 0.4`, and the sine is 0 under reduced motion. The WebGL `low` tier removes this light. three.js `getDistanceAttenuation`:

```
falloff = 1 / max(distance ^ decay, 0.01)
k = saturate(1 - (distance / cutoff) ^ 4)
falloff *= k * k
```

`(distance 2, cutoff 0, decay 2) = 0.25`. With cutoff 4.2 the smooth term is 0 at `distance >= 4.2`. Light positions and the other two lights are in [PRESENTATION.md](PRESENTATION.md).

## Tile atlas patch

Tiles are one `InstancedMesh` of `MeshToonMaterial`. `onBeforeCompile` injects this and nothing else. `atlas` is an instanced `vec2`: `(0 or 0.5, 0 or 0.5)`, from `seeded(2718)` as in PRESENTATION.md. The cache key is the string `dice-corners-tile-atlas`.

```glsl
attribute vec2 atlas;
// inside the map-uv block, after #include <uv_vertex>:
#ifdef USE_MAP
vMapUv = vMapUv * 0.5 + atlas;
#endif
```

Die face UVs are rewritten on the CPU in `game.js` (`u' = (col + u) / 3`, `v' = 1 - (row + 1) / 2 + v / 2`, slot groups of 4). That is not a shader. Use the atlas plus that formula, or six materials and `textures/die-face-*.png`.

## Overlay data

Plane 9×9 at `(4, 0.008, 4)`, rotation x `−π/2`. three.js `PlaneGeometry` lies in XY; after that rotation, UV `(0,0)` is the south-west corner of the board (column A, rank 1, high world Z) and UV `(1,1)` is column I, rank 9. `g = vUv * 9`, `cell = floor(g)` is board `(col, row)`. Do not flip the data texture.

`uCells` is 9×9 RGBA8, nearest, no mipmaps, index `(row * 9 + col) * 4`. The shader reconstructs bytes with `floor(channel * 255.0 + 0.5)`.

| Channel | Byte     | Meaning                                                                      |
| ------- | -------- | ---------------------------------------------------------------------------- |
| R       | distance | 0, or BFS distance `1..6` while a die is selected and the page is not `busy` |
| G       | flags    | bitfield                                                                     |
| B       | links    | path edges                                                                   |
| A       | order    | 1-based index of the preview step that enters the cell                       |

Flags: `TRAIL = 1`, `ORIGIN = 2`, `HOVER = 4`, `PATH = 8`, `CURSOR = 16`, `MOVABLE = 32`.

Links: `NORTH = 1`, `SOUTH = 2`, `EAST = 4`, `WEST = 8`. A preview step writes the travel direction on the source cell and the opposite direction on the destination, and sets `PATH` on both. The destination also gets `HOVER`. Who writes which bit is in [PRESENTATION.md](PRESENTATION.md).

`bit(flags, b)` is `mod(floor(flags / b + 0.001), 2.0)`. The `0.001` keeps the reconstructed byte from landing just under an integer.

### Overlay uniforms

| Uniform         | Live value                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uTime`         | Seconds since boot. Same clock as the sky.                                                                                                                                         |
| `uMotion`       | `1`, or `0` when reduced motion is on. Set on the motion toggle and read every frame.                                                                                              |
| `uReveal`       | `time` at the moment a die is selected, a step is undone, or `finishMove` returns `continue`. Starts at `0`.                                                                       |
| `uAccent`       | Current guild colour. Moon `#9fd4ff`, Ember `#ff7a45`.                                                                                                                             |
| `uBone`         | `#efe6d2`                                                                                                                                                                          |
| `uGold`         | `#ffc857`                                                                                                                                                                          |
| `uGoalA`        | Current guild’s goal, `(minCol, minRow, maxCol + 1, maxRow + 1)` in the same space as `g`. Moon’s goal is Ember’s home `(0, 6, 3, 9)`. Ember’s goal is Moon’s home `(6, 0, 9, 3)`. |
| `uGoalAColor`   | Current guild colour.                                                                                                                                                              |
| `uGoalB`        | The other goal, same rectangle convention.                                                                                                                                         |
| `uGoalBColor`   | The other guild colour.                                                                                                                                                            |
| `uGoalStrength` | `0.55` during `PREGAME`, otherwise `1`. The object is created at `0.6` and the first refresh overwrites it.                                                                        |
| `uRelic`        | Eases toward `0.25` when a die occupies E5 and toward `1` otherwise, factor `min(1, dt * 3)`.                                                                                      |

`uGoalA` marches (`uTime * 0.45 * uMotion`). `uGoalB` is the same band with march 0 and a 0.3 multiplier. Reduced motion (`uMotion = 0`) freezes the dashes, the relic pulse, the reachable-cell pulse, the path chase (it holds at 0.85), and the cursor bracket inset.

Built-in varyings and matrices: `uv`, `position`, `projectionMatrix`, `modelViewMatrix`.

## Sky

Sphere radius 160, 32×16 segments, back faces, depth write off, render order −10, centred on `(4, 0, 4)`. The vertex shader subtracts that centre, so `vDir` is the world direction from the table.

| Uniform    | Value                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- |
| `uTime`    | Same clock as the overlay.                                                            |
| `uMotion`  | `1`, or `0` under reduced motion. Stars stop twinkling; the gradient and nebula stay. |
| `uTop`     | `#0c0818`                                                                             |
| `uHorizon` | `#1c1030`                                                                             |
| `uBottom`  | `#050309`                                                                             |
| `uNebula`  | `#3a1f4a`                                                                             |

The last step quantises to 20 levels with a 4×4 Bayer threshold on `gl_FragCoord`. That is why a still image is the wrong asset: the dither is in framebuffer pixels and the stars move. The software renderer caches a 48×48 nebula cubemap from the same hash; it is not art.

Built-in matrices: `modelMatrix`, `viewMatrix`, `projectionMatrix`.

## Sparks

Up to 420 points. Attributes `aAlpha`, `aSize`, `aColor` (linear RGB, 0..1). `uScale` is `bufferHeight / (2 * tan(FOV / 2))` with FOV 42°, updated on layout. It starts at 300 before the first layout. Point size is `max(1, floor(aSize * uScale / -mv.z + 0.5))`. Fragments with `vAlpha < 0.02` are discarded. Integration, burst tables, and the alpha curve `min(1, life/max * 1.6)` are in [PRESENTATION.md](PRESENTATION.md). Directions are `Math.random` (open question 6 in [DESIGN.md](DESIGN.md)).

## Overlay vertex

```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

## Overlay fragment

```glsl
uniform sampler2D uCells;
uniform float uTime;
uniform float uMotion;
uniform float uReveal;
uniform vec3 uAccent;
uniform vec3 uBone;
uniform vec3 uGold;
uniform vec4 uGoalA;
uniform vec3 uGoalAColor;
uniform vec4 uGoalB;
uniform vec3 uGoalBColor;
uniform float uGoalStrength;
uniform float uRelic;
varying vec2 vUv;

float bit(float flags, float b) { return mod(floor(flags / b + 0.001), 2.0); }

float goalBand(vec2 g, vec4 r, float px, float march) {
  float dx = min(g.x - r.x, r.z - g.x);
  float dy = min(g.y - r.y, r.w - g.y);
  if (dx < 0.0 || dy < 0.0) return 0.0;
  float d = min(dx, dy);
  float band = step(0.035, d) * step(d, 0.035 + 2.0 * px);
  float along = dx < dy ? g.y : g.x;
  float dash = step(0.35, fract(along * 2.0 - march));
  return band * dash;
}

void main() {
  vec2 g = vUv * 9.0;
  vec2 cell = floor(g);
  vec2 f = g - cell;
  float px = max(fwidth(g.x), fwidth(g.y));
  vec4 d = texture2D(uCells, (cell + 0.5) / 9.0);
  float dist = floor(d.r * 255.0 + 0.5);
  float flags = floor(d.g * 255.0 + 0.5);
  float links = floor(d.b * 255.0 + 0.5);
  float order = floor(d.a * 255.0 + 0.5);
  vec2 c = f - 0.5;
  vec2 ac = abs(c);
  float edge = 0.5 - max(ac.x, ac.y);
  float wave = uMotion * sin(uTime * 3.4);
  vec3 col = vec3(0.0);

  float march = uTime * 0.45 * uMotion;
  col += uGoalAColor * goalBand(g, uGoalA, px, march) * 0.95 * uGoalStrength;
  vec2 inA = step(uGoalA.xy, g) * step(g, uGoalA.zw);
  col += uGoalAColor * inA.x * inA.y * 0.035 * uGoalStrength;
  col += uGoalBColor * goalBand(g, uGoalB, px, 0.0) * 0.3 * uGoalStrength;

  if (cell.x == 4.0 && cell.y == 4.0) {
    float r = length(c);
    float ring = step(abs(r - 0.44), 0.9 * px) + 0.5 * step(abs(r - 0.39), 0.6 * px);
    col += uGold * ring * uRelic * (0.65 + 0.35 * sin(uTime * 2.0) * uMotion);
  }

  if (bit(flags, 32.0) > 0.5) {
    float tick = step(edge, 2.2 * px) * step(0.3, min(ac.x, ac.y));
    col += uAccent * tick * (1.1 + 0.3 * wave);
  }

  if (dist > 0.5) {
    float t = (uTime - uReveal) * 8.0 - dist;
    float appear = mix(1.0, clamp(t + 1.0, 0.0, 1.0), uMotion);
    float pulse = 0.8 + 0.2 * uMotion * sin(uTime * 3.4 - dist * 1.2);
    float frame = step(0.075, edge) * step(edge, 0.075 + 1.4 * px);
    float corner = step(0.25, min(ac.x, ac.y));
    col += uAccent * (frame * mix(0.55, 1.35, corner) + 0.17) * appear * pulse;
  }

  if (bit(flags, 1.0) > 0.5 && dist < 0.5) {
    col += uAccent * step(max(ac.x, ac.y), 0.07) * 0.45;
  }

  if (bit(flags, 2.0) > 0.5) {
    col += uAccent * step(abs(length(c) - 0.36), 0.9 * px) * 0.85;
  }

  if (bit(flags, 8.0) > 0.5) {
    float w = 1.1 * px;
    float line = 0.0;
    if (bit(links, 1.0) > 0.5) line = max(line, step(ac.x, w) * step(0.0, c.y));
    if (bit(links, 2.0) > 0.5) line = max(line, step(ac.x, w) * step(c.y, 0.0));
    if (bit(links, 4.0) > 0.5) line = max(line, step(ac.y, w) * step(0.0, c.x));
    if (bit(links, 8.0) > 0.5) line = max(line, step(ac.y, w) * step(c.x, 0.0));
    float node = step(max(ac.x, ac.y), 0.075);
    float chase = uMotion > 0.5 ? 0.35 + 0.65 * pow(0.5 + 0.5 * cos(uTime * 7.0 - order * 1.4), 3.0) : 0.85;
    col += mix(uBone, uAccent, 0.4) * max(line, node) * chase;
  }

  if (bit(flags, 4.0) > 0.5) {
    float frame = step(0.035, edge) * step(edge, 0.035 + 2.0 * px);
    col += uAccent * (0.32 + frame * 1.3);
  }

  if (bit(flags, 16.0) > 0.5) {
    float inset = 0.015 + 0.035 * (0.5 + 0.5 * sin(uTime * 5.0)) * uMotion;
    float bracket = step(inset, edge) * step(edge, inset + 2.0 * px) * step(0.28, min(ac.x, ac.y));
    col += uBone * bracket * 1.2;
  }

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
```

## Sky vertex

```glsl
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = world.xyz - vec3(4.0, 0.0, 4.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}
```

## Sky fragment

```glsl
uniform float uTime;
uniform float uMotion;
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uNebula;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  float m[16];
  m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
  m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
  return (m[int(q.y * 4.0 + q.x)] + 0.5) / 16.0;
}
void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.7, h));
  col = mix(col, uBottom, smoothstep(0.05, -0.7, h));
  float n = noise(dir * 3.2) * 0.6 + noise(dir * 7.1) * 0.4;
  col += uNebula * smoothstep(0.55, 0.9, n) * 0.55;
  vec3 p = dir * 95.0;
  vec3 cell = floor(p);
  float r = hash(cell);
  if (r > 0.93) {
    vec3 centre = cell + 0.5 + (vec3(hash(cell + 3.1), hash(cell + 7.7), hash(cell + 1.3)) - 0.5) * 0.5;
    float s = smoothstep(0.42, 0.0, length(p - centre));
    float tw = 0.65 + 0.35 * sin(uTime * (0.8 + r * 3.0) + r * 60.0) * uMotion;
    col += vec3(0.8, 0.76, 1.0) * s * tw * (r > 0.985 ? 1.0 : 0.45);
  }
  float levels = 20.0;
  col = floor(col * levels + bayer(gl_FragCoord.xy)) / levels;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
```

## Spark vertex

```glsl
attribute float aAlpha;
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, floor(aSize * uScale / -mv.z + 0.5));
  vAlpha = aAlpha;
  vColor = aColor;
}
```

## Spark fragment

```glsl
varying float vAlpha;
varying vec3 vColor;
void main() {
  if (vAlpha < 0.02) discard;
  gl_FragColor = vec4(vColor * vAlpha, 1.0);
  #include <colorspace_fragment>
}
```
