import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  DIRECTION_NAMES,
  FACE_ORDER,
  LOCAL_FACE_NORMALS,
  OPPOSITE,
  PIP_LAYOUT,
  faceValueToward,
  identityQuat,
  initialQuat,
  rollQuat,
  sameRotation,
  topFaceValue
} from '../../../static/dice-corners/game-logic.js';
import { loadClassicOracle } from './classic-oracle';
import { componentDelta, pick, seededRandom } from './test-utils';

const classic = loadClassicOracle();

describe('classic oracle', () => {
  it('reproduces the rotation self-tests of the original page', () => {
    const start = new THREE.Quaternion();
    let q = start.clone();
    for (let i = 0; i < 4; i++) q = classic.rollDie(q, 'NORTH');
    expect(q.angleTo(start)).toBeLessThan(1e-6);
    expect(classic.topFaceValue(classic.rollDie(start.clone(), 'NORTH'))).toBe(2);
    expect(classic.topFaceValue(classic.rollDie(start.clone(), 'WEST'))).toBe(3);
  });
});

describe('rollQuat', () => {
  it('matches the classic rollDie for one roll in every direction', () => {
    expect(DIRECTION_NAMES).toEqual(['NORTH', 'SOUTH', 'EAST', 'WEST']);
    for (const direction of DIRECTION_NAMES) {
      const expected = classic.rollDie(new THREE.Quaternion(), direction);
      expect(componentDelta(rollQuat(identityQuat(), direction), expected)).toBeLessThan(1e-12);
    }
  });

  it('tracks the classic rollDie along a long random roll sequence', () => {
    const random = seededRandom(7);
    let ours = identityQuat();
    let theirs = new THREE.Quaternion();
    for (let i = 0; i < 2000; i++) {
      const direction = pick(DIRECTION_NAMES, random);
      ours = rollQuat(ours, direction);
      theirs = classic.rollDie(theirs, direction);
      expect(componentDelta(ours, theirs)).toBeLessThan(1e-12);
    }
  });

  it('returns a new quaternion and leaves its input untouched', () => {
    const start = identityQuat();
    const rolled = rollQuat(start, 'EAST');
    expect(rolled).not.toBe(start);
    expect(start).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });
});

describe('topFaceValue', () => {
  it('reads 1 at rest and the trailing face after a single roll', () => {
    expect(topFaceValue(identityQuat())).toBe(1);
    expect(topFaceValue(rollQuat(identityQuat(), 'NORTH'))).toBe(2);
    expect(topFaceValue(rollQuat(identityQuat(), 'WEST'))).toBe(3);
    expect(topFaceValue(rollQuat(identityQuat(), 'EAST'))).toBe(4);
    expect(topFaceValue(rollQuat(identityQuat(), 'SOUTH'))).toBe(5);
  });

  it('agrees with the classic geometric top face along a long random roll sequence', () => {
    const random = seededRandom(99);
    let ours = identityQuat();
    let theirs = new THREE.Quaternion();
    for (let i = 0; i < 2000; i++) {
      const direction = pick(DIRECTION_NAMES, random);
      ours = rollQuat(ours, direction);
      theirs = classic.rollDie(theirs, direction);
      expect(topFaceValue(ours)).toBe(classic.topFaceValue(theirs));
    }
  });
});

/** Every orientation reachable by rolling from rest, deduplicated by rotation. */
function reachableOrientations() {
  const found = [identityQuat()];
  for (let i = 0; i < found.length; i++) {
    for (const direction of DIRECTION_NAMES) {
      const next = rollQuat(found[i], direction);
      if (!found.some((q) => sameRotation(q, next))) found.push(next);
    }
  }
  return found;
}

const AXES = [
  [0, 1, 0],
  [0, -1, 0],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, 1],
  [0, 0, -1]
] as const;

describe('Western face layout', () => {
  it('rolls through exactly the 24 rotations of a cube', () => {
    expect(reachableOrientations()).toHaveLength(24);
  });

  it('keeps opposite faces summing to seven in every orientation', () => {
    for (const q of reachableOrientations()) {
      const values = AXES.map((axis) => faceValueToward(q, axis));
      expect([...values].sort()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(values[0] + values[1]).toBe(7);
      expect(values[2] + values[3]).toBe(7);
      expect(values[4] + values[5]).toBe(7);
    }
  });

  it('paints the same local normals as the classic die', () => {
    for (const value of [1, 2, 3, 4, 5, 6] as const) {
      const classicNormal = classic.LOCAL_FACE[value];
      expect([...LOCAL_FACE_NORMALS[value]]).toEqual([
        classicNormal.x,
        classicNormal.y,
        classicNormal.z
      ]);
      const opposite = LOCAL_FACE_NORMALS[(7 - value) as 1 | 2 | 3 | 4 | 5 | 6];
      expect(LOCAL_FACE_NORMALS[value].map((c, i) => c + opposite[i])).toEqual([0, 0, 0]);
    }
  });

  it('maps box material slots [+X,-X,+Y,-Y,+Z,-Z] to the classic face values', () => {
    expect(FACE_ORDER).toEqual(classic.faceOrder);
    const slotNormals = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];
    FACE_ORDER.forEach((value, slot) => {
      expect([...LOCAL_FACE_NORMALS[value as 1 | 2 | 3 | 4 | 5 | 6]]).toEqual(slotNormals[slot]);
    });
  });

  it('keeps the classic pip layout for every face', () => {
    expect(PIP_LAYOUT).toEqual(classic.pipLayout);
  });
});

describe('roll invariants', () => {
  it('returns to the starting orientation after four rolls in one direction', () => {
    for (const start of reachableOrientations()) {
      for (const direction of DIRECTION_NAMES) {
        let q = start;
        for (let i = 0; i < 4; i++) q = rollQuat(q, direction);
        expect(sameRotation(q, start)).toBe(true);
      }
    }
  });

  it('pairs every direction with the classic opposite that undoes it exactly', () => {
    expect(OPPOSITE).toEqual(classic.OPPOSITE);
    for (const start of reachableOrientations()) {
      for (const direction of DIRECTION_NAMES) {
        const back = rollQuat(rollQuat(start, direction), OPPOSITE[direction]);
        expect(sameRotation(back, start)).toBe(true);
        expect(topFaceValue(back)).toBe(topFaceValue(start));
      }
    }
  });

  it('stays unit length and on the cube lattice after many rolls', () => {
    const random = seededRandom(2024);
    const lattice = reachableOrientations();
    let q = identityQuat();
    for (let i = 0; i < 10000; i++) q = rollQuat(q, pick(DIRECTION_NAMES, random));
    expect(Math.hypot(q.x, q.y, q.z, q.w)).toBeCloseTo(1, 12);
    expect(lattice.some((candidate) => sameRotation(candidate, q, 1e-12))).toBe(true);
  });
});

describe('initialQuat', () => {
  it('matches the classic starting orientation for every top value and player', () => {
    for (const player of [1, 2] as const) {
      for (const top of [1, 2, 3, 4, 5, 6]) {
        const ours = initialQuat(top, player);
        expect(componentDelta(ours, classic.initialQuat(top, player))).toBeLessThan(1e-12);
        expect(topFaceValue(ours)).toBe(top);
      }
    }
  });

  it('turns Ember dice toward their own edge without changing the top face', () => {
    for (const top of [1, 2, 3, 4, 5, 6]) {
      const moonFront = faceValueToward(initialQuat(top, 1), [0, 0, 1]);
      const emberFront = faceValueToward(initialQuat(top, 2), [0, 0, -1]);
      expect(emberFront).toBe(moonFront);
    }
  });
});
