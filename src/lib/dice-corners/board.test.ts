import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  CENTER_CELL,
  DIRECTIONS,
  INITIAL_LAYOUT,
  cellKey,
  cellLabel,
  checkWin,
  countInGoal,
  createInitialState,
  getReachableCells,
  goalCells,
  homeCells,
  inBounds,
  isGoalCell,
  reconstructPath,
  initialQuat,
  topFaceValue
} from '../../../static/dice-corners/game-logic.js';
import { loadClassicOracle } from './classic-oracle';
import { componentDelta, seededRandom } from './test-utils';

const classic = loadClassicOracle();

describe('board coordinates', () => {
  it('uses the classic 9×9 grid, centre cell and cell keys', () => {
    expect(BOARD_SIZE).toBe(classic.SIZE);
    expect(cellKey(CENTER_CELL.col, CENTER_CELL.row)).toBe(classic.CENTER_KEY);
    expect(cellKey(3, 7)).toBe(classic.key(3, 7));
  });

  it('bounds-checks and labels cells like the original', () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(8, 8)).toBe(true);
    expect(inBounds(-1, 4)).toBe(false);
    expect(inBounds(4, 9)).toBe(false);
    expect(cellLabel(0, 0)).toBe('A1');
    expect(cellLabel(8, 8)).toBe('I9');
    expect(cellLabel(4, 4)).toBe('E5');
  });
});

describe('initial setup', () => {
  it('keeps all 18 classic starting cells and top values', () => {
    expect(INITIAL_LAYOUT[1]).toEqual(classic.spawnLayout[1]);
    expect(INITIAL_LAYOUT[2]).toEqual(classic.spawnLayout[2]);
  });

  it('creates Moon dice first, then Ember dice, in canonical orientations', () => {
    const state = createInitialState();
    expect(state.dice).toHaveLength(18);
    const expected = [
      ...classic.spawnLayout[1].map(([col, row, top]) => ({ player: 1, col, row, top })),
      ...classic.spawnLayout[2].map(([col, row, top]) => ({ player: 2, col, row, top }))
    ];
    state.dice.forEach((die, index) => {
      const spec = expected[index];
      expect(die).toMatchObject({ id: index, player: spec.player, col: spec.col, row: spec.row });
      expect(die.spawnValue).toBe(spec.top);
      expect(topFaceValue(die.quat)).toBe(spec.top);
      expect(componentDelta(die.quat, initialQuat(spec.top, spec.player as 1 | 2))).toBe(0);
    });
  });

  it('starts in the pregame with Moon to move on turn one and nothing selected', () => {
    const state = createInitialState();
    expect(state).toMatchObject({
      phase: 'PREGAME',
      currentPlayer: 1,
      turnNumber: 1,
      selectedId: null,
      stepBudget: 0,
      stepsRemaining: 0,
      origin: null,
      path: [],
      redoStack: [],
      winner: null
    });
  });
});

/** Places every die on a distinct cell; `fill` forces some dice into their goal first. */
function scatter(state: ReturnType<typeof createInitialState>, random: () => number, fill: number) {
  const cells = Array.from({ length: 81 }, (_, i) => ({ col: i % 9, row: Math.floor(i / 9) }));
  const taken = new Set<string>();
  const take = (candidates: { col: number; row: number }[]) => {
    const free = candidates.filter((c) => !taken.has(cellKey(c.col, c.row)));
    const cell = free[Math.floor(random() * free.length)];
    taken.add(cellKey(cell.col, cell.row));
    return cell;
  };
  for (const die of state.dice) {
    const goal = cells.filter((c) => isGoalCell(die.player, c.col, c.row));
    const forced = die.id % 9 < fill;
    Object.assign(die, take(forced ? goal : cells));
  }
  return state;
}

describe('home and goal zones', () => {
  it('matches the classic corner zones: each player fills the other home corner', () => {
    const keys = (cells: { col: number; row: number }[]) =>
      cells.map((c) => cellKey(c.col, c.row)).sort();
    expect(keys(homeCells(1))).toEqual([...classic.zones[1]].sort());
    expect(keys(homeCells(2))).toEqual([...classic.zones[2]].sort());
    expect(keys(goalCells(1))).toEqual([...classic.zones[2]].sort());
    expect(keys(goalCells(2))).toEqual([...classic.zones[1]].sort());
    expect(isGoalCell(1, 0, 8)).toBe(true);
    expect(isGoalCell(1, 8, 0)).toBe(false);
    expect(isGoalCell(2, 8, 0)).toBe(true);
  });

  it('declares no winner at the start', () => {
    const state = createInitialState();
    expect(checkWin(state, 1)).toBe(false);
    expect(checkWin(state, 2)).toBe(false);
    expect(countInGoal(state, 1)).toBe(0);
    expect(countInGoal(state, 2)).toBe(0);
  });

  it('wins only when all nine dice occupy the opponent home corner', () => {
    const state = createInitialState();
    const goal = goalCells(1);
    state.dice.filter((d) => d.player === 1).forEach((die, i) => Object.assign(die, goal[i]));
    state.dice
      .filter((d) => d.player === 2)
      .forEach((die, i) => Object.assign(die, { col: 3 + (i % 3), row: 3 + Math.floor(i / 3) }));
    expect(countInGoal(state, 1)).toBe(9);
    expect(checkWin(state, 1)).toBe(true);
    expect(checkWin(state, 2)).toBe(false);

    const straggler = state.dice[0];
    Object.assign(straggler, { col: 4, row: 0 });
    expect(countInGoal(state, 1)).toBe(8);
    expect(checkWin(state, 1)).toBe(false);
  });

  it('agrees with the classic checkWin on random layouts', () => {
    const random = seededRandom(31);
    for (let trial = 0; trial < 400; trial++) {
      const state = scatter(createInitialState(), random, trial % 10);
      for (const player of [1, 2] as const) {
        expect(checkWin(state, player)).toBe(classic.checkWin(state.dice, player));
      }
    }
  });
});

function randomBlockers(random: () => number, count: number, keep: { col: number; row: number }) {
  const blocked = new Set<string>();
  while (blocked.size < count) {
    const col = Math.floor(random() * 9);
    const row = Math.floor(random() * 9);
    if (col !== keep.col || row !== keep.row) blocked.add(cellKey(col, row));
  }
  return blocked;
}

describe('getReachableCells', () => {
  it('reaches the diamond of cells within the budget on an open board, excluding the origin', () => {
    const reach = getReachableCells({ col: 4, row: 4 }, 2, new Set());
    expect(reach.size).toBe(12);
    expect(reach.has(cellKey(4, 4))).toBe(false);
    for (const node of reach.values()) {
      expect(Math.abs(node.col - 4) + Math.abs(node.row - 4)).toBe(node.dist);
    }
  });

  it('returns nothing for an empty budget', () => {
    expect(getReachableCells({ col: 4, row: 4 }, 0, new Set()).size).toBe(0);
  });

  it('stays on the board', () => {
    const reach = getReachableCells({ col: 0, row: 0 }, 2, new Set());
    expect([...reach.keys()].sort()).toEqual(['0,1', '0,2', '1,0', '1,1', '2,0']);
  });

  it('never enters or crosses an occupied cell', () => {
    const wall = new Set(Array.from({ length: 9 }, (_, col) => cellKey(col, 5)));
    const reach = getReachableCells({ col: 4, row: 4 }, 6, wall);
    expect(reach.size).toBeGreaterThan(0);
    for (const node of reach.values()) expect(node.row).toBeLessThan(5);
  });

  it('routes around a blocker and charges the detour', () => {
    const blocker = new Set([cellKey(4, 5)]);
    expect(getReachableCells({ col: 4, row: 4 }, 4, blocker).get(cellKey(4, 6))?.dist).toBe(4);
    expect(getReachableCells({ col: 4, row: 4 }, 3, blocker).has(cellKey(4, 6))).toBe(false);
  });

  it('matches the classic BFS on random boards, parent links and discovery order included', () => {
    const random = seededRandom(5);
    for (let trial = 0; trial < 600; trial++) {
      const start = { col: Math.floor(random() * 9), row: Math.floor(random() * 9) };
      const blocked = randomBlockers(random, Math.floor(random() * 30), start);
      const steps = 1 + Math.floor(random() * 6);
      const ours = getReachableCells(start, steps, blocked);
      const theirs = classic.getReachableCells(start, steps, blocked);
      expect([...ours.entries()]).toEqual([...theirs.entries()]);
    }
  });
});

describe('reconstructPath', () => {
  it('turns the BFS parent chain into the rolls to make, first roll first', () => {
    const origin = { col: 4, row: 4 };
    const reach = getReachableCells(origin, 4, new Set([cellKey(4, 5)]));
    expect(reconstructPath(reach, origin, cellKey(4, 6))).toEqual([
      'EAST',
      'NORTH',
      'NORTH',
      'WEST'
    ]);
    expect(reconstructPath(reach, origin, cellKey(4, 3))).toEqual(['SOUTH']);
  });

  it('returns no rolls for a cell outside the reachable set', () => {
    const origin = { col: 4, row: 4 };
    const reach = getReachableCells(origin, 1, new Set());
    expect(reconstructPath(reach, origin, cellKey(4, 6))).toEqual([]);
    expect(reconstructPath(reach, origin, cellKey(4, 4))).toEqual([]);
  });

  it('matches the classic shortest-path choice for every reachable target on random boards', () => {
    const random = seededRandom(11);
    for (let trial = 0; trial < 250; trial++) {
      const start = { col: Math.floor(random() * 9), row: Math.floor(random() * 9) };
      const blocked = randomBlockers(random, Math.floor(random() * 25), start);
      const steps = 1 + Math.floor(random() * 6);
      const reach = getReachableCells(start, steps, blocked);
      const classicReach = classic.getReachableCells(start, steps, blocked);
      for (const [target, node] of reach) {
        const rolls = reconstructPath(reach, start, target);
        expect(rolls).toEqual(classic.reconstructPath(classicReach, start, target));
        expect(rolls).toHaveLength(node.dist);
        let col = start.col;
        let row = start.row;
        for (const roll of rolls) {
          col += DIRECTIONS[roll].dc;
          row += DIRECTIONS[roll].dr;
          expect(blocked.has(cellKey(col, row))).toBe(false);
        }
        expect(cellKey(col, row)).toBe(target);
      }
    }
  });
});
