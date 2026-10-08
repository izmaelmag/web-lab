import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  SoftRenderer,
  clipNear,
  decodeSRGB,
  distanceAttenuation,
  encodeSRGB,
  mipLevelFor,
  prepareTexture,
  sampleBilinear,
  toonRamp
} from '../../../static/dice-corners/soft-renderer.js';

/** A canvas stand-in: the renderer only needs createImageData/putImageData. */
function fakeCanvas(width: number, height: number) {
  const frames: ImageData[] = [];
  const ctx = {
    createImageData: (w: number, h: number) =>
      ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) as ImageData,
    putImageData: (image: ImageData) => frames.push(image),
    clearRect: () => {}
  };
  const canvas = {
    width,
    height,
    style: {} as Record<string, string>,
    getContext: () => ctx
  } as unknown as HTMLCanvasElement;
  return { canvas, frames };
}

function setup(width = 32, height = 32) {
  const { canvas } = fakeCanvas(width, height);
  const renderer = new SoftRenderer({ canvas });
  renderer.setSize(width, height, false);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  const pixel = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [...renderer.color.slice(i, i + 4)];
  };
  return { renderer, scene, camera, pixel };
}

const quad = (size: number, color: number, params: Record<string, unknown> = {}) =>
  new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ color, ...params })
  );

describe('soft renderer colour maths', () => {
  it('round-trips sRGB bytes through linear light', () => {
    for (let byte = 0; byte < 256; byte++) {
      expect(Math.abs(encodeSRGB(decodeSRGB(byte)) - byte)).toBeLessThanOrEqual(1);
    }
    expect(encodeSRGB(-1)).toBe(0);
    expect(encodeSRGB(2)).toBe(255);
    expect(encodeSRGB(Number.NaN)).toBe(0);
  });

  it('samples the toon ramp like three.js (nearest texel at dot * 0.5 + 0.5)', () => {
    const ramp = new Uint8Array([88, 150, 206, 255]);
    expect(toonRamp(ramp, -1)).toBeCloseTo(88 / 255);
    expect(toonRamp(ramp, -0.2)).toBeCloseTo(150 / 255);
    expect(toonRamp(ramp, 0.2)).toBeCloseTo(206 / 255);
    expect(toonRamp(ramp, 1)).toBeCloseTo(1);
    expect(toonRamp(null, 1)).toBe(1);
    expect(toonRamp(null, -1)).toBe(0.7);
  });

  it('attenuates point lights with the three.js distance falloff', () => {
    expect(distanceAttenuation(1, 0, 2)).toBeCloseTo(1);
    expect(distanceAttenuation(2, 0, 2)).toBeCloseTo(0.25);
    expect(distanceAttenuation(4.2, 4.2, 2)).toBe(0);
    expect(distanceAttenuation(5, 4.2, 2)).toBe(0);
    expect(distanceAttenuation(1, 4.2, 2)).toBeGreaterThan(0.9);
  });

  it('picks mip levels from the texel-to-pixel ratio', () => {
    expect(mipLevelFor(100, 100, 5)).toBe(0);
    expect(mipLevelFor(400, 100, 5)).toBeCloseTo(1);
    expect(mipLevelFor(1600, 100, 5)).toBeCloseTo(2);
    expect(mipLevelFor(1e9, 1, 5)).toBe(5);
    expect(mipLevelFor(10, 0, 5)).toBe(0);
  });

  it('builds a box-filtered mip chain and samples it bilinearly', () => {
    const data = new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255, 255, 0, 0, 255]);
    const texture = new THREE.DataTexture(data, 2, 2, THREE.RGBAFormat);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    const prepared = prepareTexture(texture)!;
    expect(prepared.levels.map((l) => [l.w, l.h])).toEqual([
      [2, 2],
      [1, 1]
    ]);
    expect([...prepared.levels[1].data]).toEqual([0.5, 0, 0.5, 1]);
    const out = new Float32Array(4);
    sampleBilinear(prepared.levels[0], 0.5, 0.5, out);
    expect([...out]).toEqual([0.5, 0, 0.5, 1]);
    sampleBilinear(prepared.levels[0], 0, 1, out);
    expect([...out]).toEqual([1, 0, 0, 1]);
  });
});

describe('near-plane clipping', () => {
  const vertex = (x: number, y: number, z: number, w: number, u = 0) => [x, y, z, w, u, 0, 0, 0, 0];
  it('keeps a triangle that is fully in front', () => {
    const poly = [...vertex(0, 0, 0, 1), ...vertex(1, 0, 0, 1), ...vertex(0, 1, 0, 1)];
    expect(clipNear(poly)).toEqual(poly);
  });

  it('cuts a triangle crossing the near plane and interpolates attributes', () => {
    // one vertex behind the eye (z < -w)
    const poly = [...vertex(0, 0, -3, 1, 0), ...vertex(1, 0, 0, 1, 1), ...vertex(0, 1, 0, 1, 1)];
    const out = clipNear(poly);
    expect(out.length / 9).toBe(4);
    for (let i = 0; i < out.length; i += 9)
      expect(out[i + 2] + out[i + 3]).toBeGreaterThanOrEqual(-1e-9);
    // the new vertices sit exactly on the plane, a third of the way along
    expect(out[4 * 9 - 9 + 4]).toBeCloseTo(2 / 3);
  });

  it('drops a triangle entirely behind the eye', () => {
    const poly = [...vertex(0, 0, -3, 1), ...vertex(1, 0, -3, 1), ...vertex(0, 1, -3, 1)];
    expect(clipNear(poly)).toEqual([]);
  });
});

describe('SoftRenderer', () => {
  it('mirrors the WebGLRenderer surface game.js relies on', () => {
    const { renderer } = setup();
    expect(renderer.isSoftRenderer).toBe(true);
    expect(renderer.capabilities.isWebGL2).toBe(false);
    expect(renderer.capabilities.getMaxAnisotropy()).toBe(1);
    expect(renderer.shadowMap).toMatchObject({ enabled: false });
    renderer.setPixelRatio(1);
    renderer.setSize(20, 10, false);
    expect([renderer.domElement.width, renderer.domElement.height]).toEqual([20, 10]);
    expect(() => renderer.dispose()).not.toThrow();
  });

  it('clears to the scene background and draws an unlit mesh in sRGB', () => {
    const { renderer, scene, camera, pixel } = setup();
    scene.background = new THREE.Color('#102030');
    scene.add(quad(1, 0xff8000));
    renderer.render(scene, camera);
    expect(pixel(0, 0)).toEqual([0x10, 0x20, 0x30, 255]);
    expect(pixel(16, 16)).toEqual([255, 128, 0, 255]);
    expect(renderer.info.render.calls).toBe(1);
    expect(renderer.info.render.triangles).toBe(2);
  });

  it('depth-tests regardless of draw order', () => {
    const { renderer, scene, camera, pixel } = setup();
    const near = quad(1, 0x00ff00);
    near.position.z = 1;
    const far = quad(3, 0xff0000);
    scene.add(near, far);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 255, 0, 255]);
    expect(pixel(16, 9)).toEqual([255, 0, 0, 255]);
    // same picture when the far quad is drawn last and forced to the front
    far.renderOrder = 1;
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 255, 0, 255]);
  });

  it('culls by material side', () => {
    const { renderer, scene, camera, pixel } = setup();
    const front = quad(1, 0xffffff);
    front.rotation.y = Math.PI; // now facing away
    scene.add(front);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 0, 0, 255]);
    (front.material as THREE.MeshBasicMaterial).side = THREE.BackSide;
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([255, 255, 255, 255]);
  });

  it('adds additive materials on top and skips invisible ones', () => {
    const { renderer, scene, camera, pixel } = setup();
    scene.add(quad(3, 0x400000));
    const glow = quad(1, 0x0000ff, {
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    glow.position.z = 0.5;
    scene.add(glow);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0x40, 0, 255, 255]);
    glow.visible = false;
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0x40, 0, 0, 255]);
  });

  it('lights toon materials with the three.js ramp, Lambert 1/π and emissive', () => {
    const { renderer, scene, camera, pixel } = setup();
    const gradientMap = new THREE.DataTexture(
      new Uint8Array([88, 150, 206, 255]),
      4,
      1,
      THREE.RedFormat
    );
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap })
    );
    scene.add(mesh);
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(0, 0, 10);
    scene.add(light, light.target);
    renderer.render(scene, camera);
    // facing the light: ramp = 1, so π · 1/π = full white
    expect(pixel(16, 16)).toEqual([255, 255, 255, 255]);
    light.position.set(0, 10, 0); // grazing: dot = 0 → ramp texel 2 (206)
    renderer.render(scene, camera);
    const expected = encodeSRGB(206 / 255);
    expect(pixel(16, 16)[0]).toBeGreaterThanOrEqual(expected - 1);
    expect(pixel(16, 16)[0]).toBeLessThanOrEqual(expected + 1);
    light.visible = false;
    (mesh.material as THREE.MeshToonMaterial).emissive.set(0x00ff00);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 255, 0, 255]);
  });

  it('fades distant pixels into linear fog', () => {
    const { renderer, scene, camera, pixel } = setup();
    scene.fog = new THREE.Fog(0x0000ff, 1, 2);
    scene.add(quad(10, 0xff0000));
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 0, 255, 255]);
    scene.fog = new THREE.Fog(0x0000ff, 10, 20);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([255, 0, 0, 255]);
  });

  it('clips geometry that reaches behind the camera instead of smearing it', () => {
    const { renderer, scene, camera, pixel } = setup();
    const floor = quad(40, 0xffffff);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    scene.add(floor);
    renderer.render(scene, camera);
    expect(pixel(16, 31)).toEqual([255, 255, 255, 255]); // floor below
    expect(pixel(16, 0)).toEqual([0, 0, 0, 255]); // sky above the horizon
  });

  it('draws instanced meshes with per-instance matrices and colours', () => {
    const { renderer, scene, camera, pixel } = setup();
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      2
    );
    const m = new THREE.Matrix4();
    mesh.setMatrixAt(0, m.makeTranslation(-1, 0, 0));
    mesh.setMatrixAt(1, m.makeTranslation(1, 0, 0));
    mesh.setColorAt(0, new THREE.Color(0xff0000));
    mesh.setColorAt(1, new THREE.Color(0x00ff00));
    scene.add(mesh);
    renderer.render(scene, camera);
    expect(pixel(16 - 6, 16)).toEqual([255, 0, 0, 255]);
    expect(pixel(16 + 6, 16)).toEqual([0, 255, 0, 255]);
    expect(pixel(16, 16)).toEqual([0, 0, 0, 255]);
  });

  it('runs a JS fragment port for shader materials and skips shaders without one', () => {
    const { renderer, scene, camera, pixel } = setup();
    const material = new THREE.ShaderMaterial({ transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);
    renderer.render(scene, camera);
    expect(pixel(16, 16)).toEqual([0, 0, 0, 255]);
    let begun = 0;
    material.userData.softFragment = {
      begin: () => begun++,
      shade: (u: number, v: number, _fu: number, _fv: number, out: Float32Array) => {
        out[0] = u > 0.5 ? 1 : 0;
        out[1] = v > 0.5 ? 1 : 0;
        out[2] = 0;
        out[3] = 1;
        return true;
      }
    };
    renderer.render(scene, camera);
    expect(begun).toBe(1);
    expect(pixel(20, 12)).toEqual([255, 255, 0, 255]); // right, top
    expect(pixel(12, 20)).toEqual([0, 0, 0, 255]); // left, bottom
  });
});
