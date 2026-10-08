// Dice Corners — software renderer.
//
// A small CPU rasteriser that draws the same three.js scene into a Canvas 2D
// context, for browsers where WebGL cannot start at all: hardware
// acceleration switched off, a blocklisted GPU or driver, remote desktops and
// VMs. Since Chrome 137 Chromium no longer falls back to its software GL
// (SwiftShader) in those cases, so every Chromium browser — Chrome, Brave,
// Edge, Opera, Vivaldi — simply has no WebGL there.
//
// It mirrors the WebGLRenderer surface game.js uses (setSize, render, clear,
// shadowMap, capabilities, info, dispose) and covers exactly the subset of
// three.js the game needs: MeshToonMaterial and MeshBasicMaterial meshes
// (textures with mipmaps, instancing, geometry groups, face sides, alpha test,
// normal and additive blending, linear fog), hemisphere / directional / point
// lights, and ShaderMaterials or Points that bring a JavaScript port of their
// shader in material.userData (softSky, softFragment, softPoints). Shadows
// are not drawn. The game renders a few hundred art pixels across, so this
// stays interactive on any CPU.
import * as THREE from 'three';

/* ---------------------------------------------------------------------------
   Colour space helpers
   --------------------------------------------------------------------------- */

const TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
const LUT_SIZE = 4096;
const TO_SRGB = new Uint8ClampedArray(LUT_SIZE + 1);
for (let i = 0; i <= LUT_SIZE; i++) {
  const c = i / LUT_SIZE;
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  TO_SRGB[i] = Math.round(s * 255);
}

/**
 * Linear-light channel (0..1) → 8-bit sRGB.
 * @param {number} linear
 */
export function encodeSRGB(linear) {
  if (!(linear > 0)) return 0;
  if (linear >= 1) return 255;
  return TO_SRGB[(linear * LUT_SIZE + 0.5) | 0];
}

/**
 * 8-bit sRGB → linear-light channel (0..1).
 * @param {number} byte
 */
export function decodeSRGB(byte) {
  return TO_LINEAR[byte & 255];
}

const INV_PI = 1 / Math.PI;
// Opaque pixels are written as one 32-bit word on little-endian machines
// (every browser platform in practice); big-endian falls back to bytes.
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/* ---------------------------------------------------------------------------
   Textures
   --------------------------------------------------------------------------- */

/**
 * @typedef {{ w: number, h: number, data: Float32Array }} MipLevel
 * @typedef {{ version: number, levels: MipLevel[], mipmaps: boolean }} SoftTexture
 */

/**
 * Pixels of a texture as linear RGBA floats plus a box-filtered mip chain.
 * @param {any} texture a three.js CanvasTexture / DataTexture
 * @returns {SoftTexture | null}
 */
export function prepareTexture(texture) {
  const image = texture.image;
  if (!image || !image.width || !image.height) return null;
  const w = image.width;
  const h = image.height;
  /** @type {ArrayLike<number> | null} */
  let bytes = null;
  let channels = 4;
  if (image.data) {
    bytes = image.data;
    channels = Math.max(1, Math.round(image.data.length / (w * h)));
  } else if (typeof document !== 'undefined') {
    // copy through a scratch canvas so the source canvas is never read back
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(image, 0, 0);
      bytes = ctx.getImageData(0, 0, w, h).data;
    }
  }
  if (!bytes) return null;
  const srgb = texture.colorSpace === THREE.SRGBColorSpace;
  const data = new Float32Array(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      const byte = bytes[i * channels + Math.min(c, channels - 1)];
      data[i * 4 + c] = srgb ? TO_LINEAR[byte] : byte / 255;
    }
    data[i * 4 + 3] = channels === 4 ? bytes[i * 4 + 3] / 255 : 1;
  }
  /** @type {MipLevel[]} */
  const levels = [{ w, h, data }];
  const mipmaps =
    texture.generateMipmaps !== false &&
    texture.minFilter !== THREE.NearestFilter &&
    texture.minFilter !== THREE.LinearFilter;
  if (mipmaps) {
    let level = levels[0];
    while (level.w > 1 || level.h > 1) {
      const nw = Math.max(1, level.w >> 1);
      const nh = Math.max(1, level.h >> 1);
      const next = new Float32Array(nw * nh * 4);
      for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
          const x0 = Math.min(level.w - 1, x * 2);
          const x1 = Math.min(level.w - 1, x * 2 + 1);
          const y0 = Math.min(level.h - 1, y * 2);
          const y1 = Math.min(level.h - 1, y * 2 + 1);
          for (let c = 0; c < 4; c++) {
            next[(y * nw + x) * 4 + c] =
              (level.data[(y0 * level.w + x0) * 4 + c] +
                level.data[(y0 * level.w + x1) * 4 + c] +
                level.data[(y1 * level.w + x0) * 4 + c] +
                level.data[(y1 * level.w + x1) * 4 + c]) *
              0.25;
          }
        }
      }
      level = { w: nw, h: nh, data: next };
      levels.push(level);
    }
  }
  return { version: texture.version, levels, mipmaps };
}

/**
 * Mip level for a triangle: log2 of how many texels land on one pixel.
 * @param {number} texelArea triangle area in texels²
 * @param {number} pixelArea triangle area in pixels²
 * @param {number} maxLevel
 */
export function mipLevelFor(texelArea, pixelArea, maxLevel) {
  if (!(pixelArea > 0) || !(texelArea > 0)) return 0;
  const lod = 0.5 * Math.log2(texelArea / pixelArea);
  return Math.max(0, Math.min(maxLevel, lod));
}

/**
 * Bilinear, clamp-to-edge sample of one mip level into out[0..3].
 * @param {MipLevel} level
 * @param {number} u
 * @param {number} v
 * @param {Float32Array} out
 * @param {number} weight blend factor into out (1 = replace)
 */
export function sampleBilinear(level, u, v, out, weight = 1) {
  const { w, h, data } = level;
  let fx = u * w - 0.5;
  let fy = (1 - v) * h - 0.5;
  fx = fx < 0 ? 0 : fx > w - 1 ? w - 1 : fx;
  fy = fy < 0 ? 0 : fy > h - 1 ? h - 1 : fy;
  const x0 = fx | 0;
  const y0 = fy | 0;
  const x1 = x0 + 1 < w ? x0 + 1 : x0;
  const y1 = y0 + 1 < h ? y0 + 1 : y0;
  const tx = fx - x0;
  const ty = fy - y0;
  const a = (y0 * w + x0) * 4;
  const b = (y0 * w + x1) * 4;
  const c = (y1 * w + x0) * 4;
  const d = (y1 * w + x1) * 4;
  const k = 1 - weight;
  for (let i = 0; i < 4; i++) {
    const top = data[a + i] + (data[b + i] - data[a + i]) * tx;
    const bottom = data[c + i] + (data[d + i] - data[c + i]) * tx;
    out[i] = out[i] * k + (top + (bottom - top) * ty) * weight;
  }
}

/* ---------------------------------------------------------------------------
   Lighting (MeshToonMaterial, three.js r185 semantics)
   --------------------------------------------------------------------------- */

/**
 * The toon ramp: three samples gradientMap.r at dot(N, L) * 0.5 + 0.5 with
 * nearest filtering; without a gradient map it uses a soft 0.7 / 1.0 step.
 * @param {ArrayLike<number> | null} ramp red channel bytes of the gradient map
 * @param {number} dotNL
 */
export function toonRamp(ramp, dotNL) {
  const coord = dotNL * 0.5 + 0.5;
  if (!ramp || ramp.length === 0) return coord < 0.7 ? 0.7 : 1;
  const i = Math.max(0, Math.min(ramp.length - 1, Math.floor(coord * ramp.length)));
  return ramp[i] / 255;
}

/**
 * three.js getDistanceAttenuation.
 * @param {number} d distance to the light
 * @param {number} cutoff light.distance (0 = infinite)
 * @param {number} decay
 */
export function distanceAttenuation(d, cutoff, decay) {
  let falloff = 1 / Math.max(Math.pow(d, decay), 0.01);
  if (cutoff > 0) {
    const k = Math.min(1, Math.max(0, 1 - Math.pow(d / cutoff, 4)));
    falloff *= k * k;
  }
  return falloff;
}

/* ---------------------------------------------------------------------------
   Rasteriser
   --------------------------------------------------------------------------- */

const BLEND_NONE = 0;
const BLEND_NORMAL = 1;
const BLEND_ADD = 2;
const KIND_SURFACE = 0;
const KIND_FRAGMENT = 1;

// Clip-space vertex: x, y, z, w, u, v, point-light r, g, b
const STRIDE = 9;

/**
 * Clips a convex polygon (flat array of STRIDE-sized vertices) against the
 * near plane z > -w, interpolating every attribute linearly in clip space.
 * @param {number[]} poly
 * @returns {number[]}
 */
export function clipNear(poly) {
  const out = [];
  const n = poly.length / STRIDE;
  for (let i = 0; i < n; i++) {
    const a = i * STRIDE;
    const b = ((i + 1) % n) * STRIDE;
    const da = poly[a + 2] + poly[a + 3];
    const db = poly[b + 2] + poly[b + 3];
    if (da >= 0) for (let k = 0; k < STRIDE; k++) out.push(poly[a + k]);
    if (da >= 0 !== db >= 0) {
      const t = da / (da - db);
      for (let k = 0; k < STRIDE; k++) out.push(poly[a + k] + (poly[b + k] - poly[a + k]) * t);
    }
  }
  return out;
}

const _mat = new THREE.Matrix4();
const _mv = new THREE.Matrix4();
const _mvp = new THREE.Matrix4();
const _frustum = new THREE.Frustum();
const _sphere = new THREE.Sphere();
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _color = new THREE.Color();
const _instanceColor = new THREE.Color();

export class SoftRenderer {
  /**
   * @param {{ canvas?: HTMLCanvasElement, alpha?: boolean }} [options]
   */
  constructor({ canvas, alpha = false } = {}) {
    this.domElement = canvas ?? document.createElement('canvas');
    const ctx = this.domElement.getContext('2d', { alpha });
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
    this.alpha = alpha;
    this.isSoftRenderer = true;
    this.outputColorSpace = THREE.SRGBColorSpace;
    this.shadowMap = { enabled: false, type: THREE.PCFShadowMap };
    this.capabilities = { isWebGL2: false, getMaxAnisotropy: () => 1 };
    this.info = { render: { calls: 0, triangles: 0, frame: 0 } };
    this.pixelRatio = 1;
    this.width = 0;
    this.height = 0;
    /** @type {ImageData | null} */
    this.image = null;
    this.color = new Uint8ClampedArray(0);
    this.color32 = new Uint32Array(0);
    this.depth = new Float32Array(0);
    /** @type {WeakMap<object, SoftTexture | null>} */
    this.textures = new WeakMap();
    this.sky = {
      key: '',
      bytes: new Uint8ClampedArray(0),
      known: new Uint8Array(0),
      animated: new Uint8Array(0)
    };
    this.out = new Float32Array(4);
    this.texel = new Float32Array(4);
    this.setSize(this.domElement.width || 300, this.domElement.height || 150, false);
  }

  /** @param {number} ratio */
  setPixelRatio(ratio) {
    this.pixelRatio = ratio;
  }

  getPixelRatio() {
    return this.pixelRatio;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {boolean} [updateStyle]
   */
  setSize(width, height, updateStyle = true) {
    const w = Math.max(1, Math.floor(width * this.pixelRatio));
    const h = Math.max(1, Math.floor(height * this.pixelRatio));
    if (updateStyle) {
      this.domElement.style.width = `${width}px`;
      this.domElement.style.height = `${height}px`;
    }
    if (w === this.width && h === this.height && this.image) return;
    this.width = w;
    this.height = h;
    this.domElement.width = w;
    this.domElement.height = h;
    this.image = this.ctx.createImageData(w, h);
    this.color = this.image.data;
    this.color32 = new Uint32Array(this.color.buffer, this.color.byteOffset, w * h);
    this.depth = new Float32Array(w * h);
    this.sky.key = '';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  dispose() {
    this.textures = new WeakMap();
  }

  /** @param {any} texture */
  texture(texture) {
    if (!texture) return null;
    let entry = this.textures.get(texture);
    if (entry === undefined || (entry && entry.version !== texture.version)) {
      entry = prepareTexture(texture);
      this.textures.set(texture, entry);
    }
    return entry;
  }

  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  render(scene, camera) {
    const { width, height, color, depth } = this;
    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();
    this.info.render.calls = 0;
    this.info.render.triangles = 0;
    this.info.render.frame++;

    // clear
    depth.fill(0);
    const bg = /** @type {any} */ (scene.background);
    if (bg && bg.isColor) {
      bg.getRGB(_color, THREE.SRGBColorSpace);
      const r = Math.round(_color.r * 255);
      const g = Math.round(_color.g * 255);
      const b = Math.round(_color.b * 255);
      if (LITTLE_ENDIAN) this.color32.fill((0xff000000 | (b << 16) | (g << 8) | r) >>> 0);
      else {
        for (let i = 0; i < color.length; i += 4) {
          color[i] = r;
          color[i + 1] = g;
          color[i + 2] = b;
          color[i + 3] = 255;
        }
      }
    } else {
      color.fill(0);
      if (!this.alpha) for (let i = 3; i < color.length; i += 4) color[i] = 255;
    }

    // lights and drawables
    const lights = {
      hemi: /** @type {any[]} */ ([]),
      dir: /** @type {any[]} */ ([]),
      point: /** @type {any[]} */ ([])
    };
    /** @type {any[]} */
    const items = [];
    /** @type {any} */
    let skyItem = null;
    _mat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_mat);
    scene.traverseVisible((object) => {
      const o = /** @type {any} */ (object);
      if (o.isHemisphereLight) {
        _v.setFromMatrixPosition(o.matrixWorld).normalize();
        lights.hemi.push({
          dir: _v.toArray(),
          sky: o.color.toArray().map((/** @type {number} */ c) => c * o.intensity),
          ground: o.groundColor.toArray().map((/** @type {number} */ c) => c * o.intensity)
        });
      } else if (o.isDirectionalLight) {
        _v.setFromMatrixPosition(o.matrixWorld);
        _v2.setFromMatrixPosition(o.target.matrixWorld);
        lights.dir.push({
          dir: _v.sub(_v2).normalize().toArray(),
          color: o.color.toArray().map((/** @type {number} */ c) => c * o.intensity)
        });
      } else if (o.isPointLight) {
        lights.point.push({
          pos: _v.setFromMatrixPosition(o.matrixWorld).toArray(),
          color: o.color.toArray().map((/** @type {number} */ c) => c * o.intensity),
          distance: o.distance,
          decay: o.decay
        });
      } else if (o.isMesh || o.isPoints) {
        const material = o.material;
        if (!material) return;
        if (!Array.isArray(material) && material.userData?.softSky) {
          skyItem = o;
          return;
        }
        if (o.frustumCulled && !o.isInstancedMesh && o.geometry) {
          if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
          _sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
          if (!_frustum.intersectsSphere(_sphere)) return;
        }
        _v.setFromMatrixPosition(o.matrixWorld).applyMatrix4(_mat);
        // opaque meshes go front to back by their far extent, so big backdrops
        // (the table, the well) come last and the depth test skips their
        // hidden pixels before any shading
        _v2.setFromMatrixPosition(o.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const far =
          -_v2.z + (o.geometry.boundingSphere?.radius ?? 0) * o.matrixWorld.getMaxScaleOnAxis();
        const groups = Array.isArray(material)
          ? o.geometry.groups.length
            ? o.geometry.groups
            : [{ start: 0, count: Infinity, materialIndex: 0 }]
          : [{ start: 0, count: Infinity, materialIndex: -1 }];
        for (const group of groups) {
          const m = group.materialIndex < 0 ? material : material[group.materialIndex];
          if (!m || !m.visible) continue;
          items.push({ object: o, material: m, group, z: _v.z, far, order: o.renderOrder });
        }
      }
    });

    const opaque = items.filter((it) => !it.material.transparent);
    const transparent = items.filter((it) => it.material.transparent);
    opaque.sort((a, b) => a.order - b.order || a.far - b.far);
    transparent.sort((a, b) => a.order - b.order || b.z - a.z);

    const fog = /** @type {any} */ (scene.fog);
    for (const it of opaque) this.drawItem(it, camera, lights, fog);
    if (skyItem) this.drawSky(skyItem, camera);
    for (const it of transparent) this.drawItem(it, camera, lights, fog);

    this.ctx.putImageData(/** @type {ImageData} */ (this.image), 0, 0);
  }

  /**
   * Background sphere drawn with a JS port of its shader wherever nothing else
   * covered the pixel. Results are cached while the camera holds still; only
   * pixels the shader reports as animated (twinkling stars) are redrawn.
   * @param {any} mesh
   * @param {THREE.Camera} camera
   */
  drawSky(mesh, camera) {
    const shader = mesh.material.userData.softSky;
    const { width, height, color, depth } = this;
    const radius = (mesh.geometry.parameters?.radius ?? 1) * mesh.matrixWorld.getMaxScaleOnAxis();
    const center = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);
    const eye = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const key = [
      width,
      height,
      shader.version ?? 0,
      ...camera.matrixWorld.elements,
      ...camera.projectionMatrix.elements
    ].join(',');
    const sky = this.sky;
    const n = width * height;
    if (sky.key !== key || sky.bytes.length !== n * 3) {
      sky.key = key;
      sky.bytes = new Uint8ClampedArray(n * 3);
      sky.known = new Uint8Array(n);
      sky.animated = new Uint8Array(n);
    }
    const { bytes, known, animated } = sky;
    shader.begin?.();
    const out = this.out;
    // pixel-centre ray directions are affine in screen space
    const at = (/** @type {number} */ px, /** @type {number} */ py) =>
      new THREE.Vector3((px / width) * 2 - 1, 1 - (py / height) * 2, 0.5)
        .unproject(camera)
        .sub(eye);
    const p00 = at(0.5, 0.5);
    const p10 = at(1.5, 0.5).sub(p00);
    const p01 = at(0.5, 1.5).sub(p00);
    const ox = eye.x - center.x;
    const oy = eye.y - center.y;
    const oz = eye.z - center.z;
    const oc = ox * ox + oy * oy + oz * oz - radius * radius;
    for (let y = 0, i = 0; y < height; y++) {
      for (let x = 0; x < width; x++, i++) {
        if (depth[i] !== 0) continue;
        const o = i * 4;
        if (known[i] && !animated[i]) {
          color[o] = bytes[i * 3];
          color[o + 1] = bytes[i * 3 + 1];
          color[o + 2] = bytes[i * 3 + 2];
          color[o + 3] = 255;
          continue;
        }
        // ray through the pixel centre, hitting the sky sphere from inside
        let dx = p00.x + p10.x * x + p01.x * y;
        let dy = p00.y + p10.y * x + p01.y * y;
        let dz = p00.z + p10.z * x + p01.z * y;
        const len = Math.hypot(dx, dy, dz) || 1;
        dx /= len;
        dy /= len;
        dz /= len;
        const b = ox * dx + oy * dy + oz * dz;
        const t = -b + Math.sqrt(Math.max(0, b * b - oc));
        const vx = ox + dx * t;
        const vy = oy + dy * t;
        const vz = oz + dz * t;
        const vl = Math.hypot(vx, vy, vz) || 1;
        const live = shader.shade(vx / vl, vy / vl, vz / vl, x, height - 1 - y, out);
        const r = encodeSRGB(out[0]);
        const g = encodeSRGB(out[1]);
        const bl = encodeSRGB(out[2]);
        color[o] = r;
        color[o + 1] = g;
        color[o + 2] = bl;
        color[o + 3] = 255;
        bytes[i * 3] = r;
        bytes[i * 3 + 1] = g;
        bytes[i * 3 + 2] = bl;
        known[i] = 1;
        animated[i] = live ? 1 : 0;
      }
    }
  }

  /**
   * @param {any} it
   * @param {THREE.Camera} camera
   * @param {any} lights
   * @param {any} fog
   */
  drawItem(it, camera, lights, fog) {
    const { object, material } = it;
    if (object.isPoints) {
      this.drawPoints(object, material, camera);
      return;
    }
    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    if (!position) return;
    const isShader = material.isShaderMaterial || material.isRawShaderMaterial;
    if (isShader && !material.userData?.softFragment) return;
    if ((material.transparent || isShader) && material.opacity <= 0.001) return;

    const index = geometry.index;
    const start = Math.max(0, it.group.start, geometry.drawRange.start);
    const total = index ? index.count : position.count;
    const end = Math.min(total, it.group.start + it.group.count, start + geometry.drawRange.count);
    const uv = geometry.attributes.uv;
    const map = this.texture(material.map);
    const lit = !!material.isMeshToonMaterial;
    const ramp = lit ? (material.gradientMap?.image?.data ?? null) : null;
    const fragment = material.userData?.softFragment ?? null;
    fragment?.begin?.();
    const blend = !material.transparent
      ? BLEND_NONE
      : material.blending === THREE.AdditiveBlending
        ? BLEND_ADD
        : BLEND_NORMAL;
    const instances = object.isInstancedMesh ? object.count : 1;
    const uvTransform = material.userData?.softUv ?? null;

    const tint = material.color ? material.color : _color.setRGB(1, 1, 1);
    const emissive = material.emissive
      ? [
          material.emissive.r * (material.emissiveIntensity ?? 1),
          material.emissive.g * (material.emissiveIntensity ?? 1),
          material.emissive.b * (material.emissiveIntensity ?? 1)
        ]
      : [0, 0, 0];
    let fogColor = null;
    if (fog && material.fog !== false && !isShader) {
      const c = fog.color.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
      fogColor = [c.r * 255, c.g * 255, c.b * 255, fog.near, fog.far];
    }
    const sh = {
      kind: fragment ? KIND_FRAGMENT : KIND_SURFACE,
      fragment,
      lit,
      blend,
      opacity: material.opacity ?? 1,
      alphaTest: material.alphaTest ?? 0,
      depthTest: material.depthTest !== false,
      depthWrite: material.depthWrite !== false,
      offset: material.polygonOffset ? 1 - 2e-4 * (material.polygonOffsetUnits || 0) : 1,
      fog: fogColor,
      tex: /** @type {MipLevel | null} */ (null),
      tex2: /** @type {MipLevel | null} */ (null),
      mix: 0,
      filter: false,
      r: 1,
      g: 1,
      b: 1,
      lr: 0,
      lg: 0,
      lb: 0,
      er: emissive[0],
      eg: emissive[1],
      eb: emissive[2],
      point: false
    };
    const side = material.side;
    const ia = index ? index.array : null;
    const pa = position.array;
    const ps = position.isInterleavedBufferAttribute ? position.data.stride : position.itemSize;
    const po = position.isInterleavedBufferAttribute ? position.offset : 0;
    const ua = uv ? uv.array : null;
    const us = uv ? (uv.isInterleavedBufferAttribute ? uv.data.stride : uv.itemSize) : 2;
    const uo = uv && uv.isInterleavedBufferAttribute ? uv.offset : 0;

    const world = new Float64Array(position.count * 3);
    const clip = new Float64Array(position.count * 4);
    for (let inst = 0; inst < instances; inst++) {
      _mat.copy(object.matrixWorld);
      if (object.isInstancedMesh) {
        object.getMatrixAt(inst, _mv);
        _mat.multiply(_mv);
      }
      _mv.multiplyMatrices(camera.matrixWorldInverse, _mat);
      _mvp.multiplyMatrices(camera.projectionMatrix, _mv);
      const m = _mat.elements;
      const e = _mvp.elements;
      for (let i = 0; i < position.count; i++) {
        const x = pa[po + i * ps];
        const y = pa[po + i * ps + 1];
        const z = pa[po + i * ps + 2];
        world[i * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
        world[i * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
        world[i * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
        clip[i * 4] = e[0] * x + e[4] * y + e[8] * z + e[12];
        clip[i * 4 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
        clip[i * 4 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        clip[i * 4 + 3] = e[3] * x + e[7] * y + e[11] * z + e[15];
      }
      _color.copy(tint);
      if (object.isInstancedMesh && object.instanceColor) {
        object.getColorAt(inst, _instanceColor);
        _color.multiply(_instanceColor);
      }
      sh.r = _color.r;
      sh.g = _color.g;
      sh.b = _color.b;
      const st = uvTransform ? uvTransform(inst) : null;

      for (let t = start; t + 2 < end; t += 3) {
        const i0 = ia ? ia[t] : t;
        const i1 = ia ? ia[t + 1] : t + 1;
        const i2 = ia ? ia[t + 2] : t + 2;
        // world-space face normal (all game geometry is flat-shaded)
        const ax = world[i1 * 3] - world[i0 * 3];
        const ay = world[i1 * 3 + 1] - world[i0 * 3 + 1];
        const az = world[i1 * 3 + 2] - world[i0 * 3 + 2];
        const bx = world[i2 * 3] - world[i0 * 3];
        const by = world[i2 * 3 + 1] - world[i0 * 3 + 1];
        const bz = world[i2 * 3 + 2] - world[i0 * 3 + 2];
        let nx = ay * bz - az * by;
        let ny = az * bx - ax * bz;
        let nz = ax * by - ay * bx;
        const nl = Math.hypot(nx, ny, nz);
        if (nl === 0) continue;
        nx /= nl;
        ny /= nl;
        nz /= nl;
        // facing, from the eye to the face (works with the view offset too)
        const w0 = clip[i0 * 4 + 3];
        const w1 = clip[i1 * 4 + 3];
        const w2 = clip[i2 * 4 + 3];
        let facing = 0;
        if (w0 > 0 && w1 > 0 && w2 > 0) {
          const x0 = clip[i0 * 4] / w0;
          const y0 = clip[i0 * 4 + 1] / w0;
          const area =
            (clip[i1 * 4] / w1 - x0) * (clip[i2 * 4 + 1] / w2 - y0) -
            (clip[i2 * 4] / w2 - x0) * (clip[i1 * 4 + 1] / w1 - y0);
          facing = area > 0 ? 1 : -1;
        } else {
          // straddles the near plane: decide in world space
          _v.setFromMatrixPosition(camera.matrixWorld);
          const toEye =
            (_v.x - world[i0 * 3]) * nx +
            (_v.y - world[i0 * 3 + 1]) * ny +
            (_v.z - world[i0 * 3 + 2]) * nz;
          facing = toEye > 0 ? 1 : -1;
        }
        if (side === THREE.FrontSide && facing < 0) continue;
        if (side === THREE.BackSide && facing > 0) continue;
        if (facing < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }

        // flat lighting for this face
        if (lit) {
          let lr = 0;
          let lg = 0;
          let lb = 0;
          for (const h of lights.hemi) {
            const k = 0.5 * (nx * h.dir[0] + ny * h.dir[1] + nz * h.dir[2]) + 0.5;
            lr += h.ground[0] + (h.sky[0] - h.ground[0]) * k;
            lg += h.ground[1] + (h.sky[1] - h.ground[1]) * k;
            lb += h.ground[2] + (h.sky[2] - h.ground[2]) * k;
          }
          for (const d of lights.dir) {
            const k = toonRamp(ramp, nx * d.dir[0] + ny * d.dir[1] + nz * d.dir[2]);
            lr += d.color[0] * k;
            lg += d.color[1] * k;
            lb += d.color[2] * k;
          }
          sh.lr = lr;
          sh.lg = lg;
          sh.lb = lb;
        }

        // texture level for this face
        sh.tex = null;
        sh.tex2 = null;
        sh.filter = false;
        if (map && ua) {
          const level0 = map.levels[0];
          let lvl = 0;
          if (map.mipmaps && w0 > 0 && w1 > 0 && w2 > 0) {
            const su = st ? st[0] : 1;
            const sv = st ? st[1] : 1;
            const u0 = ua[uo + i0 * us] * su * level0.w;
            const v0 = ua[uo + i0 * us + 1] * sv * level0.h;
            const tArea = Math.abs(
              (ua[uo + i1 * us] * su * level0.w - u0) *
                (ua[uo + i2 * us + 1] * sv * level0.h - v0) -
                (ua[uo + i2 * us] * su * level0.w - u0) *
                  (ua[uo + i1 * us + 1] * sv * level0.h - v0)
            );
            const sx0 = (clip[i0 * 4] / w0) * this.width;
            const sy0 = (clip[i0 * 4 + 1] / w0) * this.height;
            const pArea =
              Math.abs(
                ((clip[i1 * 4] / w1) * this.width - sx0) *
                  ((clip[i2 * 4 + 1] / w2) * this.height - sy0) -
                  ((clip[i2 * 4] / w2) * this.width - sx0) *
                    ((clip[i1 * 4 + 1] / w1) * this.height - sy0)
              ) / 4;
            lvl = mipLevelFor(tArea, pArea, map.levels.length - 1);
          }
          // minified mipmapped textures: trilinear like LinearMipmapLinear;
          // magnified ones stay nearest (the game's magFilter)
          const l0 = Math.floor(lvl);
          sh.tex = map.levels[l0];
          sh.filter = lvl > 0;
          sh.tex2 = map.levels[Math.min(map.levels.length - 1, l0 + 1)];
          sh.mix = lvl - l0;
        }

        // assemble the clip-space polygon with per-vertex attributes
        /** @type {number[]} */
        let poly = [];
        sh.point = false;
        for (const vi of [i0, i1, i2]) {
          let u = ua ? ua[uo + vi * us] : 0;
          let v = ua ? ua[uo + vi * us + 1] : 0;
          if (st) {
            u = u * st[0] + st[2];
            v = v * st[1] + st[3];
          }
          let pr = 0;
          let pg = 0;
          let pb = 0;
          if (lit) {
            for (const p of lights.point) {
              const lx = p.pos[0] - world[vi * 3];
              const ly = p.pos[1] - world[vi * 3 + 1];
              const lz = p.pos[2] - world[vi * 3 + 2];
              const dist = Math.hypot(lx, ly, lz) || 1e-6;
              const att = distanceAttenuation(dist, p.distance, p.decay);
              if (att <= 0) continue;
              const k = toonRamp(ramp, (nx * lx + ny * ly + nz * lz) / dist) * att;
              pr += p.color[0] * k;
              pg += p.color[1] * k;
              pb += p.color[2] * k;
            }
            if (pr > 0 || pg > 0 || pb > 0) sh.point = true;
          }
          poly.push(
            clip[vi * 4],
            clip[vi * 4 + 1],
            clip[vi * 4 + 2],
            clip[vi * 4 + 3],
            u,
            v,
            pr,
            pg,
            pb
          );
        }
        if (
          w0 <= 0 ||
          w1 <= 0 ||
          w2 <= 0 ||
          clip[i0 * 4 + 2] < -w0 ||
          clip[i1 * 4 + 2] < -w1 ||
          clip[i2 * 4 + 2] < -w2
        ) {
          poly = clipNear(poly);
        }
        const n = poly.length / STRIDE;
        for (let k = 1; k + 1 < n; k++) {
          this.rasterize(poly, 0, k * STRIDE, (k + 1) * STRIDE, sh);
        }
        this.info.render.triangles++;
      }
    }
    this.info.render.calls++;
  }

  /**
   * Fills one clip-space triangle.
   * @param {number[]} p polygon array
   * @param {number} a offset of vertex a
   * @param {number} b offset of vertex b
   * @param {number} c offset of vertex c
   * @param {any} sh shading state
   */
  rasterize(p, a, b, c, sh) {
    const { width, height, color, color32, depth } = this;
    const wa = p[a + 3];
    const wb = p[b + 3];
    const wc = p[c + 3];
    if (!(wa > 0 && wb > 0 && wc > 0)) return;
    // screen space, y down
    let x0 = (p[a] / wa + 1) * 0.5 * width;
    let y0 = (1 - p[a + 1] / wa) * 0.5 * height;
    let x1 = (p[b] / wb + 1) * 0.5 * width;
    let y1 = (1 - p[b + 1] / wb) * 0.5 * height;
    let x2 = (p[c] / wc + 1) * 0.5 * width;
    let y2 = (1 - p[c + 1] / wc) * 0.5 * height;
    let area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (area === 0 || !Number.isFinite(area)) return;
    let ib = b;
    let ic = c;
    if (area < 0) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
      ib = c;
      ic = b;
      area = -area;
    }
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (minX > maxX || minY > maxY) return;

    // plane equations f(x, y) = A + Bx + Cy through the three vertices
    const dx1 = x1 - x0;
    const dy1 = y1 - y0;
    const dx2 = x2 - x0;
    const dy2 = y2 - y0;
    const inv = 1 / area;
    /** @param {number} f0 @param {number} f1 @param {number} f2 */
    const plane = (f0, f1, f2) => {
      const bx = ((f1 - f0) * dy2 - (f2 - f0) * dy1) * inv;
      const cy = ((f2 - f0) * dx1 - (f1 - f0) * dx2) * inv;
      return [f0 - bx * x0 - cy * y0, bx, cy];
    };
    const iwa = 1 / wa;
    const iwb = 1 / p[ib + 3];
    const iwc = 1 / p[ic + 3];
    const IW = plane(iwa, iwb, iwc);
    const U = plane(p[a + 4] * iwa, p[ib + 4] * iwb, p[ic + 4] * iwc);
    const V = plane(p[a + 5] * iwa, p[ib + 5] * iwb, p[ic + 5] * iwc);
    const point = sh.point;
    const PR = point ? plane(p[a + 6] * iwa, p[ib + 6] * iwb, p[ic + 6] * iwc) : U;
    const PG = point ? plane(p[a + 7] * iwa, p[ib + 7] * iwb, p[ic + 7] * iwc) : U;
    const PB = point ? plane(p[a + 8] * iwa, p[ib + 8] * iwb, p[ic + 8] * iwc) : U;

    // edge functions (inside > 0) with a top-left fill rule
    /** @param {number} ax @param {number} ay @param {number} bx @param {number} by */
    const edge = (ax, ay, bx, by) => {
      const ex = bx - ax;
      const ey = by - ay;
      const topLeft = ey < 0 || (ey === 0 && ex > 0);
      // E(x, y) = ex * (y - ay) - ey * (x - ax)
      return [-ex * ay + ey * ax - (topLeft ? 0 : 1e-9), -ey, ex];
    };
    const E0 = edge(x1, y1, x2, y2);
    const E1 = edge(x2, y2, x0, y0);
    const E2 = edge(x0, y0, x1, y1);

    const tex = sh.tex;
    const tw = tex ? tex.w : 0;
    const th = tex ? tex.h : 0;
    const td = tex ? tex.data : null;
    const filter = sh.filter;
    const tex2 = sh.tex2;
    const mix = sh.mix;
    const texel = this.texel;
    const { lit, blend, opacity, alphaTest, depthTest, depthWrite, offset, kind, fragment } = sh;
    // no fog work for triangles entirely nearer than the fog start
    const fog = sh.fog && Math.max(wa, wb, wc) > sh.fog[3] ? sh.fog : null;
    const tr = sh.r;
    const tg = sh.g;
    const tb = sh.b;
    const flr = sh.lr;
    const flg = sh.lg;
    const flb = sh.lb;
    const er = sh.er;
    const eg = sh.eg;
    const eb = sh.eb;
    const out = this.out;
    const edges = [E0, E1, E2];

    for (let y = minY; y <= maxY; y++) {
      const py = y + 0.5;
      // the row's covered span, solved from the three edges (bbox-free, so
      // long thin triangles cost only what they cover)
      let lo = minX;
      let hi = maxX;
      for (const E of edges) {
        const base = E[0] + E[2] * py;
        if (E[1] > 0) lo = Math.max(lo, Math.ceil(-base / E[1] - 0.5) - 1);
        else if (E[1] < 0) hi = Math.min(hi, Math.floor(-base / E[1] - 0.5) + 1);
        else if (base < 0) hi = -1;
      }
      if (lo > hi) continue;
      const px0 = lo + 0.5;
      let e0 = E0[0] + E0[1] * px0 + E0[2] * py;
      let e1 = E1[0] + E1[1] * px0 + E1[2] * py;
      let e2 = E2[0] + E2[1] * px0 + E2[2] * py;
      let iw = IW[0] + IW[1] * px0 + IW[2] * py;
      let un = U[0] + U[1] * px0 + U[2] * py;
      let vn = V[0] + V[1] * px0 + V[2] * py;
      let rn = PR[0] + PR[1] * px0 + PR[2] * py;
      let gn = PG[0] + PG[1] * px0 + PG[2] * py;
      let bn = PB[0] + PB[1] * px0 + PB[2] * py;
      let i = y * width + lo;
      for (
        let x = lo;
        x <= hi;
        x++,
          i++,
          e0 += E0[1],
          e1 += E1[1],
          e2 += E2[1],
          iw += IW[1],
          un += U[1],
          vn += V[1],
          rn += PR[1],
          gn += PG[1],
          bn += PB[1]
      ) {
        if (e0 < 0 || e1 < 0 || e2 < 0) continue;
        const z = iw * offset;
        if (depthTest && z <= depth[i]) continue;
        const w = 1 / iw;
        const u = un * w;
        const v = vn * w;
        let r;
        let g;
        let b;
        let alpha = opacity;
        if (kind === KIND_FRAGMENT) {
          // screen-space derivatives for fwidth()
          const ux = (un + U[1]) / (iw + IW[1]) - u;
          const vx = (vn + V[1]) / (iw + IW[1]) - v;
          const uy = (un + U[2]) / (iw + IW[2]) - u;
          const vy = (vn + V[2]) / (iw + IW[2]) - v;
          if (!fragment.shade(u, v, Math.abs(ux) + Math.abs(uy), Math.abs(vx) + Math.abs(vy), out))
            continue;
          r = encodeSRGB(out[0]);
          g = encodeSRGB(out[1]);
          b = encodeSRGB(out[2]);
          alpha *= out[3];
        } else {
          let cr = tr;
          let cg = tg;
          let cb = tb;
          if (filter) {
            sampleBilinear(/** @type {MipLevel} */ (tex), u, v, texel, 1);
            if (mix > 0.01) sampleBilinear(/** @type {MipLevel} */ (tex2), u, v, texel, mix);
            cr *= texel[0];
            cg *= texel[1];
            cb *= texel[2];
            alpha *= texel[3];
          } else if (td) {
            let tx = Math.floor(u * tw);
            let ty = Math.floor((1 - v) * th);
            tx = tx < 0 ? 0 : tx >= tw ? tw - 1 : tx;
            ty = ty < 0 ? 0 : ty >= th ? th - 1 : ty;
            const k = (ty * tw + tx) * 4;
            cr *= td[k];
            cg *= td[k + 1];
            cb *= td[k + 2];
            alpha *= td[k + 3];
          }
          if (alphaTest > 0 && alpha < alphaTest) continue;
          if (lit) {
            let lr = flr;
            let lg = flg;
            let lb = flb;
            if (point) {
              lr += rn * w;
              lg += gn * w;
              lb += bn * w;
            }
            cr = cr * lr * INV_PI + er;
            cg = cg * lg * INV_PI + eg;
            cb = cb * lb * INV_PI + eb;
          }
          r = encodeSRGB(cr);
          g = encodeSRGB(cg);
          b = encodeSRGB(cb);
          if (fog) {
            // three applies fog after the sRGB conversion, by view depth (= w)
            let f = (w - fog[3]) / (fog[4] - fog[3]);
            f = f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
            r += (fog[0] - r) * f;
            g += (fog[1] - g) * f;
            b += (fog[2] - b) * f;
          }
        }
        const o = i * 4;
        if (blend === BLEND_NONE) {
          if (LITTLE_ENDIAN) {
            color32[i] =
              0xff000000 | (((b + 0.5) | 0) << 16) | (((g + 0.5) | 0) << 8) | ((r + 0.5) | 0);
          } else {
            color[o] = r;
            color[o + 1] = g;
            color[o + 2] = b;
            color[o + 3] = 255;
          }
        } else if (blend === BLEND_ADD) {
          color[o] += r * alpha;
          color[o + 1] += g * alpha;
          color[o + 2] += b * alpha;
        } else {
          const k = alpha >= 1 ? 1 : alpha;
          color[o] += (r - color[o]) * k;
          color[o + 1] += (g - color[o + 1]) * k;
          color[o + 2] += (b - color[o + 2]) * k;
          color[o + 3] += (255 - color[o + 3]) * k;
        }
        if (depthWrite) depth[i] = z;
      }
    }
  }

  /**
   * Point sprites (the spark particles): square points with additive blending.
   * Needs material.userData.softPoints = { color, alpha, size, scale } naming
   * the colour / alpha / size attributes and a function returning the point
   * scale uniform.
   * @param {any} points
   * @param {any} material
   * @param {THREE.Camera} camera
   */
  drawPoints(points, material, camera) {
    const spec = material.userData?.softPoints;
    if (!spec) return;
    const g = points.geometry;
    const pos = g.attributes.position;
    const col = g.attributes[spec.color];
    const alp = g.attributes[spec.alpha];
    const siz = g.attributes[spec.size];
    if (!pos || !col || !alp || !siz) return;
    const { width, height, color, depth } = this;
    _mv.multiplyMatrices(camera.matrixWorldInverse, points.matrixWorld);
    const e = _mv.elements;
    const P = camera.projectionMatrix.elements;
    const scale = spec.scale();
    const additive = material.blending === THREE.AdditiveBlending;
    for (let i = 0; i < pos.count; i++) {
      const a = alp.array[i];
      if (a < 0.02) continue;
      const x = pos.array[i * 3];
      const y = pos.array[i * 3 + 1];
      const z = pos.array[i * 3 + 2];
      const vx = e[0] * x + e[4] * y + e[8] * z + e[12];
      const vy = e[1] * x + e[5] * y + e[9] * z + e[13];
      const vz = e[2] * x + e[6] * y + e[10] * z + e[14];
      if (vz >= -(/** @type {any} */ (camera).near ?? 0)) continue;
      const cx = P[0] * vx + P[4] * vy + P[8] * vz + P[12];
      const cy = P[1] * vx + P[5] * vy + P[9] * vz + P[13];
      const cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15];
      const sx = (cx / cw + 1) * 0.5 * width;
      const sy = (1 - cy / cw) * 0.5 * height;
      const size = Math.max(1, Math.floor((siz.array[i] * scale) / -vz + 0.5));
      const iw = 1 / cw;
      const r = encodeSRGB(col.array[i * 3] * a);
      const gg = encodeSRGB(col.array[i * 3 + 1] * a);
      const b = encodeSRGB(col.array[i * 3 + 2] * a);
      const x0 = Math.round(sx - size / 2);
      const y0 = Math.round(sy - size / 2);
      for (let py = Math.max(0, y0); py < Math.min(height, y0 + size); py++) {
        for (let px = Math.max(0, x0); px < Math.min(width, x0 + size); px++) {
          const k = py * width + px;
          if (iw <= depth[k]) continue;
          const o = k * 4;
          if (additive) {
            color[o] += r;
            color[o + 1] += gg;
            color[o + 2] += b;
          } else {
            color[o] = r;
            color[o + 1] = gg;
            color[o + 2] = b;
          }
        }
      }
    }
    this.info.render.calls++;
  }
}
