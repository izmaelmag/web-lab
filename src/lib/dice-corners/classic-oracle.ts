// Test oracle: evaluates the rule functions straight out of the canonical
// static/dice-corners/classic.html, so the extracted module is compared with
// the shipped original rather than with a hand-copied version of it.
import { readFileSync } from 'node:fs';
import * as THREE from 'three';

export type ClassicDirection = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

export interface ClassicReachNode {
  dist: number;
  prev: string | null;
  col: number;
  row: number;
}

export interface ClassicDie {
  player: 1 | 2;
  col: number;
  row: number;
}

interface ClassicCore {
  CONFIG: {
    CELL_SIZE: number;
    DIE_SIZE: number;
    ROLL_DURATION: number;
    CAMERA_TRANSITION: number;
    CAM_DIST: number;
    CAM_HEIGHT: number;
    CAM_MIN: number;
    CAM_MAX: number;
    BONUS_LIFT: number;
  };
  SIZE: number;
  CENTER_KEY: string | null;
  DIRECTIONS: Record<ClassicDirection, { dc: number; dr: number; world: THREE.Vector3 }>;
  OPPOSITE: Record<ClassicDirection, ClassicDirection>;
  LOCAL_FACE: Record<string, THREE.Vector3>;
  key: (col: number, row: number) => string;
  cellToWorld: (col: number, row: number) => THREE.Vector3;
  tileToWorld: (col: number, row: number) => THREE.Vector3;
  inBounds: (col: number, row: number) => boolean;
  rollDie: (q: THREE.Quaternion, direction: ClassicDirection) => THREE.Quaternion;
  topFaceValue: (q: THREE.Quaternion) => number;
  initialQuat: (topValue: number, player: 1 | 2) => THREE.Quaternion;
  getReachableCells: (
    start: { col: number; row: number },
    steps: number,
    occupied: { has(key: string): boolean }
  ) => Map<string, ClassicReachNode>;
}

export interface ClassicOracle extends ClassicCore {
  reconstructPath: (
    reachable: Map<string, ClassicReachNode>,
    selected: { col: number; row: number },
    targetKey: string
  ) => ClassicDirection[];
  spawnLayout: { 1: number[][]; 2: number[][] };
  zones: { 1: string[]; 2: string[] };
  faceOrder: number[];
  pipLayout: Record<number, number[][]>;
  checkWin: (dice: ClassicDie[], player: 1 | 2) => boolean;
  isStuck: (occupied: Set<string>, die: ClassicDie) => boolean;
  playerHasMove: (occupied: Set<string>, dice: ClassicDie[], currentPlayer: 1 | 2) => boolean;
}

const CLASSIC_URL = new URL('../../../static/dice-corners/classic.html', import.meta.url);

export function readClassicSource(): string {
  return readFileSync(CLASSIC_URL, 'utf8');
}

function indexOrThrow(source: string, marker: string, from = 0): number {
  const index = source.indexOf(marker, from);
  if (index < 0) throw new Error(`classic oracle: missing "${marker}"`);
  return index;
}

/** Returns `head { ...balanced body... }` for the first occurrence of `head`. */
function block(source: string, head: string): string {
  const start = indexOrThrow(source, head);
  let depth = 0;
  let quote: string | null = null;
  for (let i = indexOrThrow(source, '{', start); i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') i = source.indexOf('\n', i);
    else if (ch === '/' && source[i + 1] === '*') i = source.indexOf('*/', i) + 1;
    else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`classic oracle: unbalanced block for "${head}"`);
}

function evaluate<T>(params: string[], body: string, args: unknown[]): T {
  return new Function(...params, body)(...args) as T;
}

function literal<T>(source: string, pattern: RegExp): T {
  const match = source.match(pattern);
  if (!match) throw new Error(`classic oracle: missing ${pattern}`);
  return evaluate<T>([], `return ${match[1]};`, []);
}

export function loadClassicOracle(): ClassicOracle {
  const source = readClassicSource();

  // CONFIG .. getReachableCells is the dependency-free rules section of the original.
  const pureStart = indexOrThrow(source, 'const CONFIG = {');
  const pureEnd = indexOrThrow(
    source,
    '/* ====',
    indexOrThrow(source, 'function getReachableCells')
  );
  const core = evaluate<ClassicCore>(
    ['THREE'],
    `${source.slice(pureStart, pureEnd)}
return { CONFIG, SIZE, CENTER_KEY, DIRECTIONS, OPPOSITE, LOCAL_FACE, key, cellToWorld, tileToWorld, inBounds, rollDie, topFaceValue, initialQuat, getReachableCells };`,
    [THREE]
  );

  const reconstructFactory = evaluate<
    (
      highlightSet: Map<string, ClassicReachNode>,
      game: { selected: { col: number; row: number } }
    ) => (targetKey: string) => ClassicDirection[]
  >(
    ['DIRECTIONS'],
    `return (highlightSet, game) => { ${block(source, 'function reconstructPath(targetK)')}
return reconstructPath; };`,
    [core.DIRECTIONS]
  );

  const spawnSource = block(source, 'spawnDice() {');
  const zones = evaluate<{ 1: string[]; 2: string[] }>(
    ['key'],
    `${source.slice(indexOrThrow(source, 'const ZONE = {'), indexOrThrow(source, 'class GameState'))}
return ZONE;`,
    [core.key]
  );

  const checkWinFactory = evaluate<(game: { dice: ClassicDie[] }) => (player: 1 | 2) => boolean>(
    ['ZONE', 'key'],
    `return (game) => { ${block(source, 'function checkWin(player)')}
return checkWin; };`,
    [zones, core.key]
  );

  const methods = evaluate<{
    isStuck: (this: unknown, die: ClassicDie) => boolean;
    playerHasMove: (this: unknown) => boolean;
  }>(
    ['DIRECTIONS', 'inBounds', 'key'],
    `return { ${block(source, 'isStuck(die) {')}, ${block(source, 'playerHasMove() {')} };`,
    [core.DIRECTIONS, core.inBounds, core.key]
  );

  return {
    ...core,
    reconstructPath: (reachable, selected, targetKey) =>
      reconstructFactory(reachable, { selected })(targetKey),
    spawnLayout: {
      1: literal<number[][]>(spawnSource, /const p1 = (\[[\s\S]*?\]);/),
      2: literal<number[][]>(spawnSource, /const p2 = (\[[\s\S]*?\]);/)
    },
    zones,
    faceOrder: literal<number[]>(source, /const FACE_ORDER = (\[[^\]]*\]);/),
    pipLayout: literal<Record<number, number[][]>>(source, /const PIP_LAYOUT = (\{[\s\S]*?\});/),
    checkWin: (dice, player) => checkWinFactory({ dice })(player),
    isStuck: (occupied, die) => methods.isStuck.call({ occupied }, die),
    playerHasMove: (occupied, dice, currentPlayer) =>
      methods.playerHasMove.call({ occupied, dice, currentPlayer, isStuck: methods.isStuck })
  };
}
