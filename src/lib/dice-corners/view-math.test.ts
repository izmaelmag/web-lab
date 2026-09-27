import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  DIRECTIONS,
  DIRECTION_NAMES,
  initialQuat,
  rollQuat,
  sameRotation
} from '../../../static/dice-corners/game-logic.js';
import {
  arrowToDirection,
  cellToWorld,
  choosePixelScale,
  createQualityGovernor,
  fitBoardView,
  rollPose,
  viewOffsetPixels,
  worldToCell
} from '../../../static/dice-corners/view-math.js';
import { loadClassicOracle } from './classic-oracle';
import { componentDelta } from './test-utils';

const classic = loadClassicOracle();

describe('cell ↔ world mapping', () => {
  it('places cell centres exactly where the classic board did', () => {
    for (let col = 0; col < 9; col++) {
      for (let row = 0; row < 9; row++) {
        const tile = classic.tileToWorld(col, row);
        expect(cellToWorld(col, row)).toEqual({ x: tile.x, z: tile.z });
      }
    }
  });

  it('maps any point on a cell back to that cell, and nothing off the board', () => {
    expect(worldToCell(0, 8)).toEqual({ col: 0, row: 0 });
    expect(worldToCell(4.49, 3.51)).toEqual({ col: 4, row: 4 });
    expect(worldToCell(8.4, -0.4)).toEqual({ col: 8, row: 8 });
    expect(worldToCell(-0.51, 4)).toBeNull();
    expect(worldToCell(4, 8.51)).toBeNull();
  });
});

describe('rollPose', () => {
  const start = { x: 4, y: 0.425, z: 4 };

  it('tips over the leading bottom edge and lands dead-centre on the next cell', () => {
    for (const direction of DIRECTION_NAMES) {
      const q0 = initialQuat(3, 2);
      const [dx, , dz] = DIRECTIONS[direction].world;
      const first = rollPose(start, q0, direction, 0);
      expect(first.position).toEqual([4, 0.425, 4].map((v) => expect.closeTo(v, 12)));
      expect(sameRotation(first.quat, q0)).toBe(true);

      const mid = rollPose(start, q0, direction, 0.5);
      expect(mid.position[1]).toBeCloseTo(0.425 * Math.SQRT2, 12);

      const last = rollPose(start, q0, direction, 1);
      expect(last.position).toEqual([4 + dx, 0.425, 4 + dz].map((v) => expect.closeTo(v, 12)));
      expect(sameRotation(last.quat, rollQuat(q0, direction))).toBe(true);
    }
  });

  it('follows the classic animateRoll arc sample for sample', () => {
    const { DIE_SIZE, CELL_SIZE } = classic.CONFIG;
    for (const direction of DIRECTION_NAMES) {
      const startQuat = classic.initialQuat(5, 1);
      const startPos = classic.cellToWorld(4, 4);
      const d = classic.DIRECTIONS[direction].world;
      const axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
      const half = DIE_SIZE / 2;
      const pivot = new THREE.Vector3(startPos.x + d.x * half, 0, startPos.z + d.z * half);
      const offset = startPos.clone().sub(pivot);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        // animateRoll's onUpdate, verbatim in intent.
        const partial = new THREE.Quaternion().setFromAxisAngle(axis, (Math.PI / 2) * t);
        const quat = partial.clone().multiply(startQuat).normalize();
        const p = offset.clone().applyQuaternion(partial).add(pivot);
        p.x += d.x * (CELL_SIZE - DIE_SIZE) * t;
        p.z += d.z * (CELL_SIZE - DIE_SIZE) * t;

        const pose = rollPose(startPos, startQuat, direction, t);
        expect(pose.position[0]).toBeCloseTo(p.x, 12);
        expect(pose.position[1]).toBeCloseTo(p.y, 12);
        expect(pose.position[2]).toBeCloseTo(p.z, 12);
        expect(componentDelta(pose.quat, quat)).toBeLessThan(1e-12);
      }
    }
  });
});

describe('arrowToDirection', () => {
  const arrows = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
  const read = (azimuth: number) => arrows.map((key) => arrowToDirection(key, azimuth));

  it('maps arrows onto the board as Moon sees it (camera behind row 1)', () => {
    expect(read(0)).toEqual(['NORTH', 'EAST', 'SOUTH', 'WEST']);
  });

  it("mirrors them from Ember's side of the table", () => {
    expect(read(Math.PI)).toEqual(['SOUTH', 'WEST', 'NORTH', 'EAST']);
    expect(read(-Math.PI)).toEqual(['SOUTH', 'WEST', 'NORTH', 'EAST']);
  });

  it('follows the camera as it orbits, snapping to the nearest board axis', () => {
    expect(read(Math.PI / 2)).toEqual(['WEST', 'NORTH', 'EAST', 'SOUTH']);
    expect(read(-Math.PI / 2)).toEqual(['EAST', 'SOUTH', 'WEST', 'NORTH']);
    expect(read(0.6)).toEqual(read(0));
    expect(read(Math.PI - 0.6)).toEqual(read(Math.PI));
  });

  it('ignores keys that are not arrows', () => {
    expect(arrowToDirection('Enter', 0)).toBeNull();
    expect(arrowToDirection('w', 0)).toBeNull();
  });
});

describe('choosePixelScale', () => {
  it('picks whole device pixels per art pixel so a cell spans about thirty art pixels', () => {
    expect(choosePixelScale({ cellCssPx: 60, dpr: 1 })).toBe(2);
    expect(choosePixelScale({ cellCssPx: 38, dpr: 3 })).toBe(4);
    expect(choosePixelScale({ cellCssPx: 60, dpr: 1, target: 20 })).toBe(3);
  });

  it('never drops below one device pixel or above the cap', () => {
    expect(choosePixelScale({ cellCssPx: 20, dpr: 1 })).toBe(1);
    expect(choosePixelScale({ cellCssPx: 0, dpr: 2 })).toBe(1);
    expect(choosePixelScale({ cellCssPx: 400, dpr: 2 })).toBe(6);
    expect(choosePixelScale({ cellCssPx: 400, dpr: 2, max: 3 })).toBe(3);
  });

  it('keeps dice legible across realistic phone and desktop sizes', () => {
    for (const dpr of [1, 1.5, 2, 3]) {
      for (let cellCssPx = 24; cellCssPx <= 140; cellCssPx += 2) {
        const scale = choosePixelScale({ cellCssPx, dpr });
        const artPerCell = (cellCssPx * dpr) / scale;
        expect(Number.isInteger(scale)).toBe(true);
        expect(artPerCell).toBeGreaterThanOrEqual(22);
        // Below the cap the pixels stay chunky; at the cap, big screens just get finer art.
        if (scale < 6) expect(artPerCell).toBeLessThan(45);
      }
    }
  });
});

describe('fitBoardView', () => {
  const classicPolar = Math.atan2(8.6, 10.5); // the original camera: 10.5 up, 8.6 back
  const base = {
    fovY: 45,
    polar: classicPolar,
    azimuth: 0,
    halfExtent: 5.2,
    yRange: [-0.6, 0.9] as [number, number],
    safe: { left: -0.92, right: 0.92, bottom: -0.62, top: 0.74 }
  };

  /** Projects the board box through a real three.js camera set up as the game would. */
  function projectedBounds(aspect: number, options: typeof base) {
    const view = fitBoardView({ ...options, aspect });
    const height = 800;
    const width = height * aspect;
    const camera = new THREE.PerspectiveCamera(options.fovY, aspect, 0.1, 500);
    const target = new THREE.Vector3(4, 0, 4);
    camera.position
      .setFromSphericalCoords(view.distance, options.polar, options.azimuth)
      .add(target);
    camera.lookAt(target);
    const offset = viewOffsetPixels(view, width, height);
    camera.setViewOffset(width, height, offset.x, offset.y, width, height);
    camera.updateMatrixWorld();
    const bounds = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        for (const y of options.yRange) {
          const p = new THREE.Vector3(4 + x * options.halfExtent, y, 4 + z * options.halfExtent);
          p.project(camera);
          bounds.left = Math.min(bounds.left, p.x);
          bounds.right = Math.max(bounds.right, p.x);
          bounds.bottom = Math.min(bounds.bottom, p.y);
          bounds.top = Math.max(bounds.top, p.y);
        }
      }
    }
    return { view, bounds };
  }

  it('fits the whole board snugly inside the safe area on a landscape screen', () => {
    const { bounds } = projectedBounds(16 / 9, base);
    const { safe } = base;
    expect(bounds.left).toBeGreaterThanOrEqual(safe.left - 1e-6);
    expect(bounds.right).toBeLessThanOrEqual(safe.right + 1e-6);
    expect(bounds.bottom).toBeGreaterThanOrEqual(safe.bottom - 1e-6);
    expect(bounds.top).toBeLessThanOrEqual(safe.top + 1e-6);
    const slackX = safe.right - safe.left - (bounds.right - bounds.left);
    const slackY = safe.top - safe.bottom - (bounds.top - bounds.bottom);
    expect(Math.min(slackX, slackY)).toBeLessThan(0.01);
  });

  it('centres the board between the HUD bands', () => {
    const { bounds } = projectedBounds(390 / 844, base);
    const { safe } = base;
    expect((bounds.top + bounds.bottom) / 2).toBeCloseTo((safe.top + safe.bottom) / 2, 4);
    expect((bounds.left + bounds.right) / 2).toBeCloseTo(0, 4);
    expect(bounds.left).toBeGreaterThanOrEqual(safe.left - 1e-6);
    expect(bounds.right).toBeLessThanOrEqual(safe.right + 1e-6);
  });

  it('backs the camera off on a portrait phone and frames both sides alike', () => {
    const landscape = fitBoardView({ ...base, aspect: 16 / 9 });
    const portrait = fitBoardView({ ...base, aspect: 390 / 844 });
    const ember = fitBoardView({ ...base, aspect: 390 / 844, azimuth: Math.PI });
    expect(portrait.distance).toBeGreaterThan(landscape.distance * 1.5);
    expect(ember.distance).toBeCloseTo(portrait.distance, 6);
    expect(ember.shiftY).toBeCloseTo(portrait.shiftY, 6);
  });
});

describe('createQualityGovernor', () => {
  const feed = (governor: ReturnType<typeof createQualityGovernor>, ms: number, frames: number) => {
    const changes: number[] = [];
    for (let i = 0; i < frames; i++) {
      const next = governor.sample(ms);
      if (next !== null) changes.push(next);
    }
    return changes;
  };

  it('leaves quality alone while frames are fast', () => {
    const governor = createQualityGovernor();
    expect(feed(governor, 16.7, 2000)).toEqual([]);
    expect(governor.level).toBe(0);
  });

  it('steps down one level per sustained slow window, stopping at the lowest', () => {
    const governor = createQualityGovernor({ levels: 3, window: 90, slowMs: 26 });
    expect(feed(governor, 40, 89)).toEqual([]);
    expect(feed(governor, 40, 1)).toEqual([1]);
    expect(feed(governor, 40, 90)).toEqual([2]);
    expect(feed(governor, 40, 500)).toEqual([]);
    expect(governor.level).toBe(2);
  });

  it('shrugs off a short burst of slow frames', () => {
    const governor = createQualityGovernor({ window: 90, slowMs: 26 });
    expect(feed(governor, 40, 30)).toEqual([]);
    expect(feed(governor, 16, 400)).toEqual([]);
    expect(governor.level).toBe(0);
  });

  it('ignores tab-switch hitches and nonsense samples', () => {
    const governor = createQualityGovernor({ window: 10, slowMs: 26 });
    expect(feed(governor, 1200, 50)).toEqual([]);
    expect(feed(governor, Number.NaN, 50)).toEqual([]);
    expect(feed(governor, -5, 50)).toEqual([]);
    expect(governor.level).toBe(0);
  });

  it('can start from a lower level on weak devices', () => {
    const governor = createQualityGovernor({ levels: 3, start: 1 });
    expect(governor.level).toBe(1);
  });
});
