// Dice Corners — deterministic rules.
//
// Pure ES module: no DOM, no WebGL, no three.js. The browser game (game.js)
// and the Vitest suite (src/lib/dice-corners) both import this file directly.
// Every rule here is lifted from classic.html and kept behaviour-identical;
// the quaternion maths mirrors three.js operation-for-operation so the
// orientation of a die matches the original to the last bit.

/**
 * @typedef {1 | 2} Player 1 = Moon (the classic "White"), 2 = Ember (the classic "Black")
 * @typedef {'NORTH' | 'SOUTH' | 'EAST' | 'WEST'} Direction
 * @typedef {{ x: number, y: number, z: number, w: number }} Quat
 * @typedef {readonly [number, number, number]} Vec3
 */

/* ---------------------------------------------------------------------------
   Directions
   Internal cells: col 0..8 (A..I), row 0..8 (row 0 = board row 1).
   World mapping (used by the renderer): x = col, z = (SIZE - 1 - row).
   --------------------------------------------------------------------------- */

/**
 * BFS / tie-break order of the original (object key order of its DIRECTIONS).
 * @type {readonly Direction[]}
 */
export const DIRECTION_NAMES = Object.freeze(['NORTH', 'SOUTH', 'EAST', 'WEST']);

/** @type {Readonly<Record<Direction, { dc: number, dr: number, world: Vec3 }>>} */
export const DIRECTIONS = Object.freeze({
  NORTH: Object.freeze({ dc: 0, dr: 1, world: /** @type {Vec3} */ (Object.freeze([0, 0, -1])) }),
  SOUTH: Object.freeze({ dc: 0, dr: -1, world: /** @type {Vec3} */ (Object.freeze([0, 0, 1])) }),
  EAST: Object.freeze({ dc: 1, dr: 0, world: /** @type {Vec3} */ (Object.freeze([1, 0, 0])) }),
  WEST: Object.freeze({ dc: -1, dr: 0, world: /** @type {Vec3} */ (Object.freeze([-1, 0, 0])) })
});

/** @type {Readonly<Record<Direction, Direction>>} */
export const OPPOSITE = Object.freeze({
  NORTH: 'SOUTH',
  SOUTH: 'NORTH',
  EAST: 'WEST',
  WEST: 'EAST'
});

/* ---------------------------------------------------------------------------
   Quaternions — same formulas and operation order as THREE.Quaternion.
   --------------------------------------------------------------------------- */

const HALF_PI = Math.PI / 2;
/** @type {Vec3} */
const UP = [0, 1, 0];

/** @returns {Quat} */
export function identityQuat() {
  return { x: 0, y: 0, z: 0, w: 1 };
}

/**
 * Hamilton product a·b (THREE.Quaternion.multiplyQuaternions).
 * @param {Quat} a
 * @param {Quat} b
 * @returns {Quat}
 */
export function multiplyQuat(a, b) {
  return {
    x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
    y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
    z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}

/**
 * @param {Vec3} axis unit axis
 * @param {number} angle radians
 * @returns {Quat}
 */
export function quatFromAxisAngle(axis, angle) {
  const s = Math.sin(angle / 2);
  return { x: axis[0] * s, y: axis[1] * s, z: axis[2] * s, w: Math.cos(angle / 2) };
}

/**
 * @param {Quat} q
 * @returns {Quat}
 */
export function normalizeQuat(q) {
  const length = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (length === 0) return identityQuat();
  const inv = 1 / length;
  return { x: q.x * inv, y: q.y * inv, z: q.z * inv, w: q.w * inv };
}

/**
 * a × b (THREE.Vector3.crossVectors).
 * @param {Vec3} a
 * @param {Vec3} b
 * @returns {Vec3}
 */
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/**
 * Spin axis for a roll: UP × travel direction, normalized. With a +90° turn
 * about this axis the top face tips toward the direction of travel.
 * @param {Direction} direction
 * @returns {Vec3}
 */
export function rollAxis(direction) {
  const axis = cross(UP, DIRECTIONS[direction].world);
  const inv = 1 / (Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]) || 1);
  return [axis[0] * inv, axis[1] * inv, axis[2] * inv];
}

/**
 * One physical roll: +90° about rollAxis(direction), premultiplied in world
 * space, then normalized to kill drift. Direction lives in the axis, never in
 * the sign of the angle.
 * @param {Quat} q
 * @param {Direction} direction
 * @returns {Quat}
 */
export function rollQuat(q, direction) {
  return normalizeQuat(multiplyQuat(quatFromAxisAngle(rollAxis(direction), HALF_PI), q));
}

/**
 * Rotates v by q (THREE.Vector3.applyQuaternion; q is assumed unit length).
 * @param {Vec3} v
 * @param {Quat} q
 * @returns {Vec3}
 */
export function rotateVector(v, q) {
  const [vx, vy, vz] = v;
  const tx = 2 * (q.y * vz - q.z * vy);
  const ty = 2 * (q.z * vx - q.x * vz);
  const tz = 2 * (q.x * vy - q.y * vx);
  return [
    vx + q.w * tx + q.y * tz - q.z * ty,
    vy + q.w * ty + q.z * tx - q.x * tz,
    vz + q.w * tz + q.x * ty - q.y * tx
  ];
}

/* ---------------------------------------------------------------------------
   Faces — the painted layout IS the Western standard (opposites sum to 7,
   1-2-3 counter-clockwise around their shared corner). Any rotation of it
   stays Western-consistent.
   --------------------------------------------------------------------------- */

/**
 * Die-space normal of each painted value, in the classic iteration order.
 * @type {Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, Vec3>>}
 */
export const LOCAL_FACE_NORMALS = Object.freeze({
  1: /** @type {Vec3} */ (Object.freeze([0, 1, 0])), // top
  2: /** @type {Vec3} */ (Object.freeze([0, 0, 1])), // south / front (toward Moon's edge)
  3: /** @type {Vec3} */ (Object.freeze([1, 0, 0])), // east / right
  4: /** @type {Vec3} */ (Object.freeze([-1, 0, 0])), // west / left
  5: /** @type {Vec3} */ (Object.freeze([0, 0, -1])), // north / back
  6: /** @type {Vec3} */ (Object.freeze([0, -1, 0])) // bottom
});

const FACE_VALUES = /** @type {const} */ ([1, 2, 3, 4, 5, 6]);

/**
 * Value of the face whose normal points most along `worldDirection`.
 * @param {Quat} q
 * @param {Vec3} worldDirection unit vector
 * @returns {number}
 */
export function faceValueToward(q, worldDirection) {
  let best = 1;
  let bestDot = -Infinity;
  for (const value of FACE_VALUES) {
    const n = rotateVector(LOCAL_FACE_NORMALS[value], q);
    const dot = n[0] * worldDirection[0] + n[1] * worldDirection[1] + n[2] * worldDirection[2];
    if (dot > bestDot) {
      bestDot = dot;
      best = value;
    }
  }
  return best;
}

/**
 * The number on top, derived geometrically from the orientation — never a counter.
 * @param {Quat} q
 * @returns {number}
 */
export function topFaceValue(q) {
  return faceValueToward(q, UP);
}

/**
 * Box material slot order [+X, -X, +Y, -Y, +Z, -Z] → painted value.
 * @type {readonly number[]}
 */
export const FACE_ORDER = Object.freeze([3, 4, 1, 6, 2, 5]);

/**
 * Pip centres on a 4×4 grid per face (gx, gy in 1..3), as painted by the original.
 * @type {Readonly<Record<number, ReadonlyArray<readonly [number, number]>>>}
 */
export const PIP_LAYOUT = Object.freeze({
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3]
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3]
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3]
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3]
  ],
  6: [
    [1, 1],
    [1, 2],
    [1, 3],
    [3, 1],
    [3, 2],
    [3, 3]
  ]
});

/**
 * True when a and b describe the same rotation (q and -q included).
 * @param {Quat} a
 * @param {Quat} b
 * @param {number} [epsilon]
 */
export function sameRotation(a, b, epsilon = 1e-9) {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  return Math.abs(dot) >= 1 - epsilon;
}

/**
 * Rolls that bring each value to the top from rest (classic initialQuat).
 * @type {Readonly<Record<number, readonly Direction[]>>}
 */
const ROLLS_TO_TOP = Object.freeze({
  1: [],
  2: ['NORTH'],
  3: ['WEST'],
  4: ['EAST'],
  5: ['SOUTH'],
  6: ['NORTH', 'NORTH']
});

/**
 * Canonical resting orientation with `topValue` up. Built only from rollQuat so
 * it is provably valid; Ember dice are turned 180° about world Y to face their
 * own near edge (top face preserved).
 * @param {number} topValue
 * @param {Player} player
 * @returns {Quat}
 */
export function initialQuat(topValue, player) {
  let q = identityQuat();
  for (const direction of ROLLS_TO_TOP[topValue] ?? []) q = rollQuat(q, direction);
  if (player === 2) q = normalizeQuat(multiplyQuat(quatFromAxisAngle(UP, Math.PI), q));
  return q;
}

/* ---------------------------------------------------------------------------
   Board
   --------------------------------------------------------------------------- */

export const BOARD_SIZE = 9;

/** @type {Readonly<{ col: number, row: number }>} */
export const CENTER_CELL = Object.freeze({ col: 4, row: 4 });

/**
 * @param {number} col
 * @param {number} row
 */
export const cellKey = (col, row) => `${col},${row}`;

/**
 * @param {number} col
 * @param {number} row
 */
export const inBounds = (col, row) => col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE;

/**
 * Chess-style label: columns A..I, rows 1..9.
 * @param {number} col
 * @param {number} row
 */
export const cellLabel = (col, row) => String.fromCharCode(65 + col) + (row + 1);

/**
 * Starting [col, row, topValue] per player, in classic spawn order.
 * Moon's home is cols 6-8 / rows 0-2 (corner I1); Ember's is cols 0-2 / rows 6-8 (corner A9).
 * @type {Readonly<Record<Player, ReadonlyArray<readonly [number, number, number]>>>}
 */
export const INITIAL_LAYOUT = Object.freeze({
  1: [
    [6, 2, 1],
    [7, 2, 1],
    [8, 2, 1],
    [6, 1, 1],
    [7, 1, 2],
    [8, 1, 2],
    [6, 0, 1],
    [7, 0, 2],
    [8, 0, 3]
  ],
  2: [
    [0, 6, 1],
    [1, 6, 1],
    [2, 6, 1],
    [0, 7, 2],
    [1, 7, 2],
    [2, 7, 1],
    [0, 8, 3],
    [1, 8, 2],
    [2, 8, 1]
  ]
});

/* ---------------------------------------------------------------------------
   Game state
   --------------------------------------------------------------------------- */

/**
 * @typedef {'PREGAME' | 'PLAYER_TURN' | 'DIE_SELECTED' | 'DIE_MOVING' | 'TRANSITION' | 'WIN'} Phase
 * @typedef {{ col: number, row: number }} Cell
 * @typedef {{ id: number, player: Player, col: number, row: number, quat: Quat, spawnValue: number }} Die
 * @typedef {{ dir: Direction, fromCol: number, fromRow: number }} PathStep
 * @typedef {{
 *   phase: Phase,
 *   currentPlayer: Player,
 *   turnNumber: number,
 *   dice: Die[],
 *   selectedId: number | null,
 *   stepBudget: number,
 *   stepsRemaining: number,
 *   origin: Cell | null,
 *   path: PathStep[],
 *   redoStack: Direction[],
 *   winner: Player | null
 * }} GameState
 */

/** @type {Readonly<Record<Phase, Phase>>} */
export const PHASE = Object.freeze({
  PREGAME: 'PREGAME',
  PLAYER_TURN: 'PLAYER_TURN',
  DIE_SELECTED: 'DIE_SELECTED',
  DIE_MOVING: 'DIE_MOVING',
  TRANSITION: 'TRANSITION',
  WIN: 'WIN'
});

/**
 * A fresh game: pregame, Moon nominally first, every die in its canonical pose.
 * @returns {GameState}
 */
export function createInitialState() {
  /** @type {Die[]} */
  const dice = [];
  for (const player of /** @type {const} */ ([1, 2])) {
    for (const [col, row, top] of INITIAL_LAYOUT[player]) {
      dice.push({
        id: dice.length,
        player,
        col,
        row,
        quat: initialQuat(top, player),
        spawnValue: top
      });
    }
  }
  return {
    phase: PHASE.PREGAME,
    currentPlayer: 1,
    turnNumber: 1,
    dice,
    selectedId: null,
    stepBudget: 0,
    stepsRemaining: 0,
    origin: null,
    path: [],
    redoStack: [],
    winner: null
  };
}

/* ---------------------------------------------------------------------------
   Home corners and the win condition
   --------------------------------------------------------------------------- */

/**
 * Each player's 3×3 home corner. A player wins by filling the OTHER home.
 * @type {Readonly<Record<Player, Readonly<{ minCol: number, maxCol: number, minRow: number, maxRow: number }>>>}
 */
export const HOME_ZONES = Object.freeze({
  1: Object.freeze({ minCol: 6, maxCol: 8, minRow: 0, maxRow: 2 }),
  2: Object.freeze({ minCol: 0, maxCol: 2, minRow: 6, maxRow: 8 })
});

/**
 * @param {Player} player
 * @returns {Player}
 */
export const opponent = (player) => (player === 1 ? 2 : 1);

/**
 * @param {Player} owner
 * @returns {Cell[]}
 */
export function homeCells(owner) {
  const zone = HOME_ZONES[owner];
  /** @type {Cell[]} */
  const cells = [];
  for (let col = zone.minCol; col <= zone.maxCol; col++) {
    for (let row = zone.minRow; row <= zone.maxRow; row++) cells.push({ col, row });
  }
  return cells;
}

/**
 * Cells `player` must fill to win: the opponent's home corner.
 * @param {Player} player
 */
export const goalCells = (player) => homeCells(opponent(player));

/**
 * @param {Player} player
 * @param {number} col
 * @param {number} row
 */
export function isGoalCell(player, col, row) {
  const zone = HOME_ZONES[opponent(player)];
  return col >= zone.minCol && col <= zone.maxCol && row >= zone.minRow && row <= zone.maxRow;
}

/**
 * How many of `player`'s dice already stand in their goal corner.
 * @param {GameState} state
 * @param {Player} player
 */
export function countInGoal(state, player) {
  return state.dice.filter((d) => d.player === player && isGoalCell(player, d.col, d.row)).length;
}

/**
 * All nine of `player`'s dice occupy the opponent's home corner.
 * @param {GameState} state
 * @param {Player} player
 */
export function checkWin(state, player) {
  return state.dice.every((d) => d.player !== player || isGoalCell(player, d.col, d.row));
}

/* ---------------------------------------------------------------------------
   Reachability — breadth-first, orthogonal, never entering or crossing an
   occupied cell. Discovery order (NORTH, SOUTH, EAST, WEST per frontier cell)
   decides which of several shortest paths a die will roll along.
   --------------------------------------------------------------------------- */

/**
 * @typedef {{ dist: number, prev: string | null, col: number, row: number }} ReachNode
 * @typedef {Map<string, ReachNode>} ReachMap
 */

/**
 * Cells reachable from `start` within `steps` rolls. The origin is not a target.
 * @param {Cell} start
 * @param {number} steps
 * @param {{ has(key: string): boolean }} occupied keys of blocked cells
 * @returns {ReachMap}
 */
export function getReachableCells(start, steps, occupied) {
  /** @type {ReachMap} */
  const result = new Map();
  const startKey = cellKey(start.col, start.row);
  result.set(startKey, { dist: 0, prev: null, col: start.col, row: start.row });
  let frontier = [{ col: start.col, row: start.row, dist: 0 }];
  while (frontier.length) {
    const next = [];
    for (const cell of frontier) {
      if (cell.dist >= steps) continue;
      for (const name of DIRECTION_NAMES) {
        const col = cell.col + DIRECTIONS[name].dc;
        const row = cell.row + DIRECTIONS[name].dr;
        if (!inBounds(col, row)) continue;
        const key = cellKey(col, row);
        if (occupied.has(key) || result.has(key)) continue;
        result.set(key, { dist: cell.dist + 1, prev: cellKey(cell.col, cell.row), col, row });
        next.push({ col, row, dist: cell.dist + 1 });
      }
    }
    frontier = next;
  }
  result.delete(startKey);
  return result;
}

/**
 * Rolls that carry a die from `start` to `targetKey` along the BFS parent chain.
 * Empty when the target is not in `reachable`.
 * @param {ReachMap} reachable result of getReachableCells for `start`
 * @param {Cell} start
 * @param {string} targetKey
 * @returns {Direction[]}
 */
export function reconstructPath(reachable, start, targetKey) {
  /** @type {Cell[]} */
  const cells = [];
  let node = reachable.get(targetKey);
  while (node && node.prev !== null) {
    cells.push({ col: node.col, row: node.row });
    node = reachable.get(node.prev);
  }
  cells.reverse();
  /** @type {Direction[]} */
  const rolls = [];
  let col = start.col;
  let row = start.row;
  for (const cell of cells) {
    const direction = directionBetween(col, row, cell.col, cell.row);
    if (direction) rolls.push(direction);
    col = cell.col;
    row = cell.row;
  }
  return rolls;
}

/**
 * Direction of a single orthogonal step, or null when the cells are not adjacent.
 * @param {number} fromCol
 * @param {number} fromRow
 * @param {number} toCol
 * @param {number} toRow
 * @returns {Direction | null}
 */
export function directionBetween(fromCol, fromRow, toCol, toRow) {
  const dc = toCol - fromCol;
  const dr = toRow - fromRow;
  return (
    DIRECTION_NAMES.find((name) => DIRECTIONS[name].dc === dc && DIRECTIONS[name].dr === dr) ?? null
  );
}

/* ---------------------------------------------------------------------------
   Occupancy and legal dice
   --------------------------------------------------------------------------- */

/**
 * Keys of every occupied cell, optionally leaving one die out (the mover).
 * @param {GameState} state
 * @param {number | null} [exceptId]
 * @returns {Set<string>}
 */
export function occupiedKeys(state, exceptId = null) {
  const keys = new Set();
  for (const die of state.dice) if (die.id !== exceptId) keys.add(cellKey(die.col, die.row));
  return keys;
}

/**
 * @param {GameState} state
 * @param {number} col
 * @param {number} row
 * @returns {Die | null}
 */
export function dieAt(state, col, row) {
  return state.dice.find((d) => d.col === col && d.row === row) ?? null;
}

/**
 * A die with no free orthogonal neighbour cannot be picked.
 * @param {GameState} state
 * @param {Die} die
 */
export function isDieStuck(state, die) {
  const occupied = occupiedKeys(state);
  return DIRECTION_NAMES.every((name) => {
    const col = die.col + DIRECTIONS[name].dc;
    const row = die.row + DIRECTIONS[name].dr;
    return !inBounds(col, row) || occupied.has(cellKey(col, row));
  });
}

/**
 * Whether `player` owns at least one die that can move. Without one, their
 * turn is forfeited automatically.
 * @param {GameState} state
 * @param {Player} [player]
 */
export function playerHasMove(state, player = state.currentPlayer) {
  return state.dice.some((d) => d.player === player && !isDieStuck(state, d));
}

/* ---------------------------------------------------------------------------
   Opening roll
   --------------------------------------------------------------------------- */

/**
 * @param {() => number} random uniform in [0, 1)
 */
export const rollD6 = (random) => 1 + Math.floor(random() * 6);

/**
 * Higher roll moves first; a tie decides nothing and is rolled again.
 * @param {number} moonRoll
 * @param {number} emberRoll
 * @returns {Player | null}
 */
export function decideFirstPlayer(moonRoll, emberRoll) {
  if (moonRoll === emberRoll) return null;
  return moonRoll > emberRoll ? 1 : 2;
}

/**
 * Rolls a d6 per guild until the tie breaks. Every pair is returned so the UI
 * can replay every tie exactly as the classic game does.
 * @param {() => number} [random]
 * @returns {{ rolls: [number, number][], firstPlayer: Player }}
 */
export function rollForFirstPlayer(random = Math.random) {
  /** @type {[number, number][]} */
  const rolls = [];
  while (true) {
    const moon = rollD6(random);
    const ember = rollD6(random);
    rolls.push([moon, ember]);
    const firstPlayer = decideFirstPlayer(moon, ember);
    if (firstPlayer) return { rolls, firstPlayer };
  }
}

/**
 * Leaves the pregame: `firstPlayer` takes turn one.
 * @param {GameState} state
 * @param {Player} firstPlayer
 */
export function startGame(state, firstPlayer) {
  if (state.phase !== PHASE.PREGAME || (firstPlayer !== 1 && firstPlayer !== 2)) return false;
  state.currentPlayer = firstPlayer;
  state.turnNumber = 1;
  state.phase = PHASE.PLAYER_TURN;
  return true;
}

/* ---------------------------------------------------------------------------
   Selection
   --------------------------------------------------------------------------- */

/**
 * @param {GameState} state
 * @returns {Die | null}
 */
export function selectedDie(state) {
  return state.selectedId === null ? null : (state.dice[state.selectedId] ?? null);
}

/** @param {GameState} state */
const isPickingPhase = (state) =>
  state.phase === PHASE.PLAYER_TURN || state.phase === PHASE.DIE_SELECTED;

/**
 * A die can be picked on its owner's turn, before the current pick has rolled,
 * as long as it has a free neighbour.
 * @param {GameState} state
 * @param {number} id
 */
export function canSelectDie(state, id) {
  const die = state.dice[id];
  return (
    !!die &&
    isPickingPhase(state) &&
    die.player === state.currentPlayer &&
    state.path.length === 0 &&
    !isDieStuck(state, die)
  );
}

/**
 * Picks a die; its current top face becomes the step budget for this turn.
 * @param {GameState} state
 * @param {number} id
 */
export function selectDie(state, id) {
  if (!canSelectDie(state, id)) return false;
  const die = state.dice[id];
  const budget = topFaceValue(die.quat);
  state.selectedId = id;
  state.phase = PHASE.DIE_SELECTED;
  state.stepBudget = budget;
  state.stepsRemaining = budget;
  state.origin = { col: die.col, row: die.row };
  state.path = [];
  state.redoStack = [];
  return true;
}

/**
 * Drops the pick. Locked once the die has rolled this turn.
 * @param {GameState} state
 */
export function deselectDie(state) {
  if (state.phase !== PHASE.DIE_SELECTED || state.path.length > 0) return false;
  state.selectedId = null;
  state.phase = PHASE.PLAYER_TURN;
  state.stepBudget = 0;
  state.stepsRemaining = 0;
  state.origin = null;
  state.redoStack = [];
  return true;
}

/**
 * Board click on a die, mirroring the original handler: the selected die
 * toggles off, another own die is picked (only before the first roll), and
 * anything else does nothing. The result says what happened.
 * @param {GameState} state
 * @param {number} id
 * @returns {'selected' | 'deselected' | 'stuck' | 'locked' | 'ignored'}
 */
export function clickDie(state, id) {
  const die = state.dice[id];
  if (!die || !isPickingPhase(state)) return 'ignored';
  if (state.selectedId === id) return deselectDie(state) ? 'deselected' : 'locked';
  if (die.player !== state.currentPlayer) return 'ignored';
  if (state.path.length > 0) return 'locked';
  if (isDieStuck(state, die)) return 'stuck';
  return selectDie(state, id) ? 'selected' : 'ignored';
}

/* ---------------------------------------------------------------------------
   Moving — the page commits one roll, animates it, then commits the next.
   --------------------------------------------------------------------------- */

/**
 * @typedef {{
 *   dieId: number,
 *   direction: Direction,
 *   from: Cell,
 *   to: Cell,
 *   fromQuat: Quat,
 *   toQuat: Quat,
 *   stepsRemaining: number
 * }} StepResult
 */

/**
 * Cells the selected die can still reach this turn.
 * @param {GameState} state
 * @returns {ReachMap}
 */
export function selectionReach(state) {
  const die = selectedDie(state);
  if (!die || state.stepsRemaining <= 0) return new Map();
  return getReachableCells(die, state.stepsRemaining, occupiedKeys(state, die.id));
}

/**
 * Rolls that would carry the selected die to (col,row); empty if unreachable.
 * @param {GameState} state
 * @param {number} col
 * @param {number} row
 * @returns {Direction[]}
 */
export function planMove(state, col, row) {
  const die = selectedDie(state);
  if (state.phase !== PHASE.DIE_SELECTED || !die) return [];
  return reconstructPath(selectionReach(state), die, cellKey(col, row));
}

/**
 * Starts a click-to-move toward any reachable cell. Clears the redo stack and
 * returns the shortest-path rolls to feed to applyStep, or null.
 * @param {GameState} state
 * @param {number} col
 * @param {number} row
 * @returns {Direction[] | null}
 */
export function beginMove(state, col, row) {
  const rolls = planMove(state, col, row);
  if (!rolls.length) return null;
  state.redoStack = [];
  state.phase = PHASE.DIE_MOVING;
  return rolls;
}

/**
 * @param {GameState} state
 * @param {Die} die
 * @param {Direction} direction
 * @returns {StepResult}
 */
function rollSelected(state, die, direction) {
  const from = { col: die.col, row: die.row };
  const fromQuat = die.quat;
  die.col += DIRECTIONS[direction].dc;
  die.row += DIRECTIONS[direction].dr;
  die.quat = rollQuat(fromQuat, direction);
  return {
    dieId: die.id,
    direction,
    from,
    to: { col: die.col, row: die.row },
    fromQuat,
    toQuat: die.quat,
    stepsRemaining: state.stepsRemaining
  };
}

/**
 * Commits one forward roll of the selected die and spends one step.
 * @param {GameState} state
 * @param {Direction} direction
 * @returns {StepResult | null}
 */
export function applyStep(state, direction) {
  const die = selectedDie(state);
  if (state.phase !== PHASE.DIE_MOVING || !die || state.stepsRemaining <= 0) return null;
  const col = die.col + DIRECTIONS[direction].dc;
  const row = die.row + DIRECTIONS[direction].dr;
  if (!inBounds(col, row) || occupiedKeys(state, die.id).has(cellKey(col, row))) return null;
  state.path.push({ dir: direction, fromCol: die.col, fromRow: die.row });
  state.stepsRemaining -= 1;
  return rollSelected(state, die, direction);
}

/**
 * Ends a run of rolls. With steps left the die stays picked; at zero the turn
 * is over and completeTurn must follow.
 * @param {GameState} state
 * @returns {'continue' | 'turn-complete' | null}
 */
export function finishMove(state) {
  if (state.phase !== PHASE.DIE_MOVING) return null;
  if (state.stepsRemaining > 0) {
    state.phase = PHASE.DIE_SELECTED;
    return 'continue';
  }
  return 'turn-complete';
}

/**
 * @param {GameState} state
 */
export const canUndo = (state) =>
  state.phase === PHASE.DIE_SELECTED && selectedDie(state) !== null && state.path.length > 0;

/**
 * @param {GameState} state
 */
export const canRedo = (state) =>
  state.phase === PHASE.DIE_SELECTED && selectedDie(state) !== null && state.redoStack.length > 0;

/**
 * Rolls the selected die back along its last roll (the physical reverse roll),
 * refunds the step and pushes the roll onto the redo stack.
 * @param {GameState} state
 * @returns {StepResult | null}
 */
export function undoStep(state) {
  const die = selectedDie(state);
  const last = state.path[state.path.length - 1];
  if (!die || !last || !canUndo(state)) return null;
  state.path.pop();
  state.stepsRemaining += 1;
  state.redoStack.push(last.dir);
  return rollSelected(state, die, OPPOSITE[last.dir]);
}

/**
 * Replays the most recently undone roll, keeping the rest of the redo stack.
 * Like any roll it must be followed by finishMove.
 * @param {GameState} state
 * @returns {StepResult | null}
 */
export function redoStep(state) {
  const direction = state.redoStack[state.redoStack.length - 1];
  if (!direction || !canRedo(state)) return null;
  state.redoStack.pop();
  state.phase = PHASE.DIE_MOVING;
  const step = applyStep(state, direction);
  if (!step) {
    state.redoStack.push(direction);
    state.phase = PHASE.DIE_SELECTED;
  }
  return step;
}

/* ---------------------------------------------------------------------------
   End of turn
   --------------------------------------------------------------------------- */

/**
 * @typedef {{ dieId: number, fromQuat: Quat, toQuat: Quat }} CenterBonus
 * @typedef {{ dieId: number, bonus: CenterBonus | null, winner: Player | null }} TurnResult
 */

/**
 * @param {number} col
 * @param {number} row
 */
export const isCenterCell = (col, row) => col === CENTER_CELL.col && row === CENTER_CELL.row;

/**
 * Resolves a turn whose steps are spent: a die ending on the centre relic is
 * turned to show 6 (canonical pose), then the mover — and only the mover — is
 * checked for the win. Clears the pick; the phase becomes WIN or TRANSITION.
 * @param {GameState} state
 * @returns {TurnResult | null}
 */
export function completeTurn(state) {
  const die = selectedDie(state);
  if (state.phase !== PHASE.DIE_MOVING || !die || state.stepsRemaining > 0) return null;
  /** @type {CenterBonus | null} */
  let bonus = null;
  if (isCenterCell(die.col, die.row)) {
    bonus = { dieId: die.id, fromQuat: die.quat, toQuat: initialQuat(6, die.player) };
    die.quat = bonus.toQuat;
  }
  const mover = state.currentPlayer;
  state.selectedId = null;
  state.stepBudget = 0;
  state.stepsRemaining = 0;
  state.origin = null;
  state.path = [];
  state.redoStack = [];
  if (checkWin(state, mover)) {
    state.winner = mover;
    state.phase = PHASE.WIN;
  } else {
    state.phase = PHASE.TRANSITION;
  }
  return { dieId: die.id, bonus, winner: state.winner };
}

/**
 * Hands the turn over: the other player moves next and the turn counter ticks.
 * Allowed after completeTurn, or to forfeit a turn with no legal die — in which
 * case `mustForfeit` is true and the page calls advanceTurn again.
 * @param {GameState} state
 * @returns {{ player: Player, turnNumber: number, mustForfeit: boolean } | null}
 */
export function advanceTurn(state) {
  const forfeiting = state.phase === PHASE.PLAYER_TURN && !playerHasMove(state);
  if (state.phase !== PHASE.TRANSITION && !forfeiting) return null;
  state.currentPlayer = opponent(state.currentPlayer);
  state.turnNumber += 1;
  state.phase = PHASE.PLAYER_TURN;
  return {
    player: state.currentPlayer,
    turnNumber: state.turnNumber,
    mustForfeit: !playerHasMove(state)
  };
}

/* ---------------------------------------------------------------------------
   Reset, trail and read-only views
   --------------------------------------------------------------------------- */

/**
 * Play again: restores the exact starting state in place.
 * @param {GameState} state
 */
export function resetGame(state) {
  Object.assign(state, createInitialState());
  return state;
}

/**
 * Origin plus every cell the picked die has rolled through this turn.
 * @param {GameState} state
 * @returns {Cell[]}
 */
export function trailCells(state) {
  const die = selectedDie(state);
  if (!die) return [];
  return [
    ...state.path.map((step) => ({ col: step.fromCol, row: step.fromRow })),
    { col: die.col, row: die.row }
  ];
}

/**
 * Steps left but no reachable cell (the classic "path blocked — undo" hint).
 * @param {GameState} state
 */
export function isSelectionBlocked(state) {
  return (
    selectedDie(state) !== null && state.stepsRemaining > 0 && selectionReach(state).size === 0
  );
}

/**
 * @param {Die} die
 */
const describeDie = (die) => ({
  id: die.id,
  player: die.player,
  col: die.col,
  row: die.row,
  top: topFaceValue(die.quat),
  cell: cellLabel(die.col, die.row)
});

/**
 * Plain, detached copy of the game for debugging and headless checks.
 * @param {GameState} state
 */
export function snapshotState(state) {
  const die = selectedDie(state);
  return {
    phase: state.phase,
    currentPlayer: state.currentPlayer,
    turnNumber: state.turnNumber,
    winner: state.winner,
    stepBudget: state.stepBudget,
    stepsRemaining: state.stepsRemaining,
    origin: state.origin ? { ...state.origin } : null,
    path: state.path.map((step) => ({ ...step })),
    redoStack: [...state.redoStack],
    selected: die ? describeDie(die) : null,
    dice: state.dice.map(describeDie),
    reachable: [...selectionReach(state).values()].map(({ col, row, dist }) => ({
      col,
      row,
      dist
    })),
    trail: trailCells(state),
    goals: { 1: countInGoal(state, 1), 2: countInGoal(state, 2) },
    canUndo: canUndo(state),
    canRedo: canRedo(state),
    blocked: isSelectionBlocked(state)
  };
}
