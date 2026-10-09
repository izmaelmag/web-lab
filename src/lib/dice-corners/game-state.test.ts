import { describe, expect, it } from 'vitest';
import {
  advanceTurn,
  applyStep,
  beginMove,
  canRedo,
  canUndo,
  cellKey,
  clickDie,
  completeTurn,
  createInitialState,
  decideFirstPlayer,
  deselectDie,
  dieAt,
  finishMove,
  initialQuat,
  isDieStuck,
  isSelectionBlocked,
  occupiedKeys,
  playerHasMove,
  redoStep,
  resetGame,
  rollForFirstPlayer,
  rollQuat,
  sameRotation,
  selectDie,
  selectedDie,
  selectionReach,
  snapshotState,
  startGame,
  topFaceValue,
  trailCells,
  undoStep
} from '../../../static/dice-corners/game-logic.js';
import { loadClassicOracle } from './classic-oracle';
import { componentDelta, seededRandom } from './test-utils';

type State = ReturnType<typeof createInitialState>;
const classic = loadClassicOracle();

/** Moves dice onto the given cells (by id) and returns the state for chaining. */
function place(state: State, cells: Record<number, [number, number]>) {
  for (const [id, [col, row]] of Object.entries(cells))
    Object.assign(state.dice[+id], { col, row });
  return state;
}

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function shuffleOntoBoard(state: State, random: () => number) {
  // Pack dice into a random subset of cells so crowded layouts are common.
  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    random
  );
  state.dice.forEach((die, i) =>
    Object.assign(die, { col: cells[i] % 9, row: Math.floor(cells[i] / 9) })
  );
  return state;
}

/** Seals one guild inside a 3×3 block against the board edge with the other guild's dice. */
function trapOneGuild(state: State, random: () => number) {
  const trapped = random() < 0.5 ? 1 : 2;
  let col0: number;
  let row0: number;
  do {
    col0 = Math.floor(random() * 7);
    row0 = Math.floor(random() * 7);
  } while (col0 !== 0 && col0 !== 6 && row0 !== 0 && row0 !== 6);
  const inBlock = (c: number, r: number) => c >= col0 && c < col0 + 3 && r >= row0 && r < row0 + 3;
  const block: [number, number][] = [];
  const rim = new Map<string, [number, number]>();
  for (let c = col0; c < col0 + 3; c++) {
    for (let r = row0; r < row0 + 3; r++) {
      block.push([c, r]);
      for (const [dc, dr] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
      ]) {
        const [nc, nr] = [c + dc, r + dr];
        if (nc >= 0 && nc < 9 && nr >= 0 && nr < 9 && !inBlock(nc, nr))
          rim.set(cellKey(nc, nr), [nc, nr]);
      }
    }
  }
  const taken = new Set([...block.map(([c, r]) => cellKey(c, r)), ...rim.keys()]);
  const elsewhere = shuffle(
    Array.from({ length: 81 }, (_, i) => [i % 9, Math.floor(i / 9)] as [number, number]).filter(
      ([c, r]) => !taken.has(cellKey(c, r))
    ),
    random
  );
  const sealers = [...shuffle([...rim.values()], random), ...elsewhere];
  const prisoners = shuffle(block, random);
  let p = 0;
  let s = 0;
  for (const die of state.dice) {
    const [col, row] = die.player === trapped ? prisoners[p++] : sealers[s++];
    Object.assign(die, { col, row });
  }
  return { state, trapped: trapped as 1 | 2 };
}

describe('occupancy', () => {
  it('indexes every die by cell and can leave one die out', () => {
    const state = createInitialState();
    expect(occupiedKeys(state).size).toBe(18);
    expect(occupiedKeys(state).has(cellKey(8, 0))).toBe(true);
    expect(occupiedKeys(state, 8).has(cellKey(8, 0))).toBe(false);
    expect(dieAt(state, 8, 0)?.id).toBe(8);
    expect(dieAt(state, 4, 4)).toBeNull();
  });
});

describe('stuck dice', () => {
  it('boxes in the four back dice of each starting corner', () => {
    const state = createInitialState();
    const stuck = state.dice.filter((d) => isDieStuck(state, d)).map((d) => cellKey(d.col, d.row));
    expect(stuck.sort()).toEqual(['0,7', '0,8', '1,7', '1,8', '7,0', '7,1', '8,0', '8,1'].sort());
    expect(playerHasMove(state, 1)).toBe(true);
    expect(playerHasMove(state, 2)).toBe(true);
  });

  it('reports no legal move when every die of a player is walled in', () => {
    // Ember's nine dice packed into the A-B-C × 7-9 corner block, sealed by Moon dice.
    const state = createInitialState();
    // prettier-ignore
    const ember = [
      [0, 8], [1, 8], [2, 8],
      [0, 7], [1, 7], [2, 7],
      [0, 6], [1, 6], [2, 6]
    ] as [number, number][];
    // prettier-ignore
    const moonWall = [
      [0, 5], [1, 5], [2, 5], [3, 6], [3, 7], [3, 8],
      [5, 5], [6, 6], [7, 7]
    ] as [number, number][];
    ember.forEach((cell, i) => place(state, { [9 + i]: cell }));
    moonWall.forEach((cell, i) => place(state, { [i]: cell }));
    expect(playerHasMove(state, 2)).toBe(false);
    expect(playerHasMove(state, 1)).toBe(true);
  });

  it('agrees with the classic isStuck and playerHasMove on crowded and sealed layouts', () => {
    const random = seededRandom(17);
    let forfeits = 0;
    for (let trial = 0; trial < 600; trial++) {
      const sealed = trial % 2 === 1 ? trapOneGuild(createInitialState(), random) : null;
      const state = sealed ? sealed.state : shuffleOntoBoard(createInitialState(), random);
      const occupied = occupiedKeys(state);
      expect(occupied.size).toBe(18);
      for (const die of state.dice)
        expect(isDieStuck(state, die)).toBe(classic.isStuck(occupied, die));
      for (const player of [1, 2] as const) {
        const expected = classic.playerHasMove(occupied, state.dice, player);
        expect(playerHasMove(state, player)).toBe(expected);
        if (!expected) forfeits++;
      }
      if (sealed) expect(playerHasMove(state, sealed.trapped)).toBe(false);
    }
    expect(forfeits).toBeGreaterThanOrEqual(300);
  });
});

/** Deterministic stand-in for Math.random that replays the given values. */
function replay(values: number[]) {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error('replay exhausted');
    return values[i++];
  };
}

describe('first-player roll', () => {
  it('gives the opening move to the higher roll and reports ties as undecided', () => {
    expect(decideFirstPlayer(5, 3)).toBe(1);
    expect(decideFirstPlayer(2, 6)).toBe(2);
    expect(decideFirstPlayer(4, 4)).toBeNull();
  });

  it('rerolls both dice until a tie breaks', () => {
    // 0.5 → 4, 0.5 → 4 (tie); 0.99 → 6, 0 → 1
    const result = rollForFirstPlayer(replay([0.5, 0.5, 0.99, 0]));
    expect(result.rolls).toEqual([
      [4, 4],
      [6, 1]
    ]);
    expect(result.firstPlayer).toBe(1);
  });

  it('does not invent a winner after more than one hundred ties', () => {
    const ties = Array.from({ length: 101 * 2 }, () => 0.5);
    const result = rollForFirstPlayer(replay([...ties, 0.99, 0]));
    expect(result.rolls).toHaveLength(102);
    expect(result.rolls.at(-1)).toEqual([6, 1]);
    expect(result.firstPlayer).toBe(1);
  });

  it('only ever rolls values from one to six', () => {
    const random = seededRandom(3);
    for (let i = 0; i < 500; i++) {
      const { rolls, firstPlayer } = rollForFirstPlayer(random);
      for (const [moon, ember] of rolls) {
        expect(moon).toBeGreaterThanOrEqual(1);
        expect(moon).toBeLessThanOrEqual(6);
        expect(ember).toBeGreaterThanOrEqual(1);
        expect(ember).toBeLessThanOrEqual(6);
      }
      const [moon, ember] = rolls[rolls.length - 1];
      expect(firstPlayer).toBe(moon > ember ? 1 : 2);
      rolls.slice(0, -1).forEach(([a, b]) => expect(a).toBe(b));
    }
  });
});

describe('startGame', () => {
  it('hands turn one to the chosen player', () => {
    const state = createInitialState();
    expect(startGame(state, 2)).toBe(true);
    expect(state).toMatchObject({
      phase: 'PLAYER_TURN',
      currentPlayer: 2,
      turnNumber: 1,
      winner: null
    });
  });

  it('only starts a game from the pregame', () => {
    const state = createInitialState();
    startGame(state, 1);
    expect(startGame(state, 2)).toBe(false);
    expect(state.currentPlayer).toBe(1);
  });
});

function started(first: 1 | 2 = 1) {
  const state = createInitialState();
  startGame(state, first);
  return state;
}

const idAt = (state: State, col: number, row: number) => {
  const die = dieAt(state, col, row);
  if (!die) throw new Error(`no die at ${col},${row}`);
  return die.id;
};

describe('selecting a die', () => {
  it('captures the current top face as the step budget', () => {
    const state = started(1);
    const id = idAt(state, 6, 2);
    expect(selectDie(state, id)).toBe(true);
    expect(state).toMatchObject({
      phase: 'DIE_SELECTED',
      selectedId: id,
      stepBudget: 1,
      stepsRemaining: 1,
      origin: { col: 6, row: 2 },
      path: [],
      redoStack: []
    });
  });

  it('reads the budget from the orientation, not from the spawn value', () => {
    const state = started(1);
    const id = idAt(state, 6, 2);
    state.dice[id].quat = initialQuat(5, 1);
    selectDie(state, id);
    expect(state.stepBudget).toBe(5);
    expect(state.stepsRemaining).toBe(5);
  });

  it('refuses opponent dice, boxed-in dice and picks outside a turn', () => {
    const pregame = createInitialState();
    expect(selectDie(pregame, idAt(pregame, 6, 2))).toBe(false);

    const state = started(1);
    expect(selectDie(state, idAt(state, 2, 6))).toBe(false);
    expect(selectDie(state, idAt(state, 7, 1))).toBe(false);
    expect(selectDie(state, 99)).toBe(false);
    expect(state.phase).toBe('PLAYER_TURN');
    expect(state.selectedId).toBeNull();
  });

  it('switches to another die and recaptures its budget before any roll', () => {
    const state = started(2);
    const first = idAt(state, 2, 6);
    const second = idAt(state, 0, 6);
    state.dice[second].quat = initialQuat(4, 2);
    selectDie(state, first);
    expect(clickDie(state, second)).toBe('selected');
    expect(state).toMatchObject({ selectedId: second, stepBudget: 4, origin: { col: 0, row: 6 } });
  });

  it('toggles the selection off when the selected die is picked again', () => {
    const state = started(1);
    const id = idAt(state, 6, 2);
    expect(clickDie(state, id)).toBe('selected');
    expect(clickDie(state, id)).toBe('deselected');
    expect(state).toMatchObject({
      phase: 'PLAYER_TURN',
      selectedId: null,
      origin: null,
      stepsRemaining: 0
    });
    expect(deselectDie(state)).toBe(false);
  });

  it('reports why a pick did nothing', () => {
    const state = started(1);
    expect(clickDie(state, idAt(state, 2, 6))).toBe('ignored');
    expect(clickDie(state, idAt(state, 8, 0))).toBe('stuck');
    expect(state.selectedId).toBeNull();
  });
});

/** Selects the die at (col,row) after forcing its top face, returning its id. */
function pickWithTop(state: State, col: number, row: number, top: number) {
  const id = idAt(state, col, row);
  state.dice[id].quat = initialQuat(top, state.dice[id].player);
  expect(selectDie(state, id)).toBe(true);
  return id;
}

/** Runs a whole click-to-move the way the game does: plan, commit each roll, settle. */
function moveTo(state: State, col: number, row: number) {
  const rolls = beginMove(state, col, row);
  if (!rolls) return null;
  const steps = rolls.map((direction) => applyStep(state, direction));
  return { rolls, steps, outcome: finishMove(state) };
}

const selectedDieQuat = (state: State) => {
  const die = selectedDie(state);
  if (!die) throw new Error('nothing selected');
  return die.quat;
};

describe('moving the selected die', () => {
  it('offers the cells reachable with the remaining steps, leaving its own cell free', () => {
    const state = started(1);
    pickWithTop(state, 6, 2, 2);
    const reach = selectionReach(state);
    expect([...reach.keys()].sort()).toEqual(['4,2', '5,1', '5,2', '5,3', '6,3', '6,4', '7,3']);
  });

  it('rolls along the shortest path, one step and one quarter-turn per cell', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    const before = state.dice[id].quat;
    const result = moveTo(state, 6, 5);
    expect(result?.rolls).toEqual(['NORTH', 'NORTH', 'NORTH']);
    expect(state.dice[id]).toMatchObject({ col: 6, row: 5 });
    expect(state.stepsRemaining).toBe(0);
    expect(state.path).toEqual([
      { dir: 'NORTH', fromCol: 6, fromRow: 2 },
      { dir: 'NORTH', fromCol: 6, fromRow: 3 },
      { dir: 'NORTH', fromCol: 6, fromRow: 4 }
    ]);
    let expected = before;
    for (let i = 0; i < 3; i++) expected = rollQuat(expected, 'NORTH');
    expect(state.dice[id].quat).toEqual(expected);
    expect(result?.steps.map((s) => s?.stepsRemaining)).toEqual([2, 1, 0]);
    expect(result?.steps[0]).toMatchObject({
      dieId: id,
      direction: 'NORTH',
      from: { col: 6, row: 2 },
      to: { col: 6, row: 3 }
    });
    expect(result?.outcome).toBe('turn-complete');
    expect(dieAt(state, 6, 2)).toBeNull();
    expect(dieAt(state, 6, 5)?.id).toBe(id);
  });

  it('keeps the budget captured at selection even though the top face changes', () => {
    const state = started(1);
    pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 3);
    expect(topFaceValue(selectedDieQuat(state))).not.toBe(3);
    expect(state.stepBudget).toBe(3);
    expect(state.stepsRemaining).toBe(2);
  });

  it('can stop partway and continue from the new cell with the remainder', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    expect(moveTo(state, 6, 3)?.outcome).toBe('continue');
    expect(state).toMatchObject({
      phase: 'DIE_SELECTED',
      stepsRemaining: 2,
      origin: { col: 6, row: 2 }
    });
    const reach = selectionReach(state);
    expect(reach.has(cellKey(6, 2))).toBe(true);
    expect(reach.get(cellKey(6, 5))?.dist).toBe(2);
    expect(moveTo(state, 6, 5)?.outcome).toBe('turn-complete');
    expect(state.dice[id]).toMatchObject({ col: 6, row: 5 });
    expect(state.path).toHaveLength(3);
  });

  it('refuses targets that are occupied, too far, or when no die is picked', () => {
    const state = started(1);
    expect(beginMove(state, 6, 3)).toBeNull();
    pickWithTop(state, 6, 2, 2);
    expect(beginMove(state, 6, 5)).toBeNull();
    expect(beginMove(state, 7, 2)).toBeNull();
    expect(beginMove(state, 6, 2)).toBeNull();
    expect(state).toMatchObject({ phase: 'DIE_SELECTED', stepsRemaining: 2, path: [] });
  });

  it('locks the pick once the die has rolled', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 3);
    expect(clickDie(state, id)).toBe('locked');
    expect(clickDie(state, idAt(state, 7, 2))).toBe('locked');
    expect(deselectDie(state)).toBe(false);
    expect(state.selectedId).toBe(id);
  });

  it('never commits an illegal single step', () => {
    const state = started(1);
    pickWithTop(state, 6, 2, 3);
    expect(applyStep(state, 'NORTH')).toBeNull(); // not moving yet
    beginMove(state, 6, 3);
    expect(applyStep(state, 'EAST')).toBeNull(); // (7,2) is occupied
    expect(state.path).toEqual([]);
  });
});

describe('undo and redo', () => {
  it('rolls the die back one cell, refunds the step and remembers the roll for redo', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 4);
    const afterFirstRoll = rollQuat(initialQuat(3, 1), 'NORTH');
    expect(canUndo(state)).toBe(true);
    const step = undoStep(state);
    expect(step).toMatchObject({
      dieId: id,
      direction: 'SOUTH',
      from: { col: 6, row: 4 },
      to: { col: 6, row: 3 },
      stepsRemaining: 2
    });
    expect(state.dice[id]).toMatchObject({ col: 6, row: 3 });
    expect(sameRotation(state.dice[id].quat, afterFirstRoll)).toBe(true);
    expect(state).toMatchObject({ phase: 'DIE_SELECTED', stepsRemaining: 2, redoStack: ['NORTH'] });
    expect(state.path).toEqual([{ dir: 'NORTH', fromCol: 6, fromRow: 2 }]);
    expect(dieAt(state, 6, 4)).toBeNull();
  });

  it('undoing every roll restores the picked state and unlocks switching dice', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    const original = state.dice[id].quat;
    moveTo(state, 5, 3);
    while (canUndo(state)) undoStep(state);
    expect(state.dice[id]).toMatchObject({ col: 6, row: 2 });
    expect(sameRotation(state.dice[id].quat, original)).toBe(true);
    expect(topFaceValue(state.dice[id].quat)).toBe(3);
    expect(state).toMatchObject({ stepsRemaining: 3, stepBudget: 3, path: [] });
    expect(state.redoStack).toHaveLength(2);
    expect(clickDie(state, idAt(state, 7, 2))).toBe('selected');
    expect(state.redoStack).toEqual([]);
  });

  it('redo replays the most recently undone roll and keeps the rest of the stack', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 4);
    undoStep(state);
    undoStep(state);
    expect(state.redoStack).toEqual(['NORTH', 'NORTH']);
    expect(canRedo(state)).toBe(true);
    const step = redoStep(state);
    expect(step).toMatchObject({
      direction: 'NORTH',
      from: { col: 6, row: 2 },
      to: { col: 6, row: 3 },
      stepsRemaining: 2
    });
    expect(finishMove(state)).toBe('continue');
    expect(state.redoStack).toEqual(['NORTH']);
    redoStep(state);
    expect(finishMove(state)).toBe('continue');
    expect(state.dice[id]).toMatchObject({ col: 6, row: 4 });
    expect(state).toMatchObject({ stepsRemaining: 1, redoStack: [] });
    expect(canRedo(state)).toBe(false);
  });

  it('a fresh move clears the redo stack', () => {
    const state = started(1);
    pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 4);
    undoStep(state);
    expect(state.redoStack).toEqual(['NORTH']);
    moveTo(state, 5, 3);
    expect(state.redoStack).toEqual([]);
  });

  it('refuses when there is nothing to undo or redo, or while rolling', () => {
    const state = started(1);
    expect(undoStep(state)).toBeNull();
    expect(redoStep(state)).toBeNull();
    pickWithTop(state, 6, 2, 3);
    expect(canUndo(state)).toBe(false);
    expect(undoStep(state)).toBeNull();
    expect(redoStep(state)).toBeNull();
    const rolls = beginMove(state, 6, 4);
    applyStep(state, rolls![0]);
    expect(canUndo(state)).toBe(false);
    expect(undoStep(state)).toBeNull();
  });
});

/** Moves dice by id onto cells; ids 0-8 are Moon, 9-17 are Ember. */
function arrange(state: State, cells: [number, number][]) {
  cells.forEach(([col, row], id) => Object.assign(state.dice[id], { col, row }));
  return state;
}

describe('ending a turn', () => {
  it('ending on the centre relic resolves the die to six in its canonical pose', () => {
    for (const [player, col, row] of [
      [1, 6, 2],
      [2, 2, 6]
    ] as const) {
      const state = started(player);
      const id = pickWithTop(state, col, row, 4);
      expect(moveTo(state, 4, 4)?.outcome).toBe('turn-complete');
      const before = state.dice[id].quat;
      const result = completeTurn(state);
      expect(result?.bonus).toEqual({
        dieId: id,
        fromQuat: before,
        toQuat: initialQuat(6, player)
      });
      expect(state.dice[id].quat).toEqual(initialQuat(6, player));
      expect(componentDelta(state.dice[id].quat, classic.initialQuat(6, player))).toBeLessThan(
        1e-12
      );
      expect(topFaceValue(state.dice[id].quat)).toBe(6);
    }
  });

  it('grants nothing for crossing the centre or pausing on it mid-turn', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 5);
    expect(moveTo(state, 4, 4)?.outcome).toBe('continue');
    moveTo(state, 4, 5);
    const rolled = state.dice[id].quat;
    expect(completeTurn(state)?.bonus).toBeNull();
    expect(state.dice[id].quat).toBe(rolled);
  });

  it('clears the pick and waits for the hand-over', () => {
    const state = started(1);
    pickWithTop(state, 6, 2, 1);
    moveTo(state, 6, 3);
    expect(completeTurn(state)).toMatchObject({ bonus: null, winner: null });
    expect(state).toMatchObject({
      phase: 'TRANSITION',
      currentPlayer: 1,
      selectedId: null,
      stepBudget: 0,
      stepsRemaining: 0,
      origin: null,
      path: [],
      redoStack: []
    });
  });

  it('refuses to end a turn while steps remain or before any pick', () => {
    const state = started(1);
    expect(completeTurn(state)).toBeNull();
    pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 3);
    expect(completeTurn(state)).toBeNull();
    expect(state.phase).toBe('DIE_SELECTED');
  });

  it('alternates players and counts every hand-over as a turn', () => {
    const state = started(2);
    pickWithTop(state, 2, 6, 1);
    moveTo(state, 3, 6);
    completeTurn(state);
    expect(advanceTurn(state)).toEqual({ player: 1, turnNumber: 2, mustForfeit: false });
    expect(state).toMatchObject({ phase: 'PLAYER_TURN', currentPlayer: 1, turnNumber: 2 });
    expect(advanceTurn(state)).toBeNull();
  });

  it('forfeits automatically when the next player has no legal die', () => {
    // prettier-ignore
    const state = arrange(createInitialState(), [
      [0, 5], [1, 5], [2, 5], [3, 7], [3, 8], [3, 5], [8, 0], [8, 1], [7, 0],
      [0, 6], [1, 6], [2, 6], [0, 7], [1, 7], [2, 7], [0, 8], [1, 8], [2, 8]
    ]);
    startGame(state, 1);
    state.dice[5].quat = initialQuat(1, 1);
    selectDie(state, 5);
    moveTo(state, 3, 6);
    completeTurn(state);
    expect(advanceTurn(state)).toEqual({ player: 2, turnNumber: 2, mustForfeit: true });
    expect(clickDie(state, 9)).toBe('stuck');
    expect(advanceTurn(state)).toEqual({ player: 1, turnNumber: 3, mustForfeit: false });
    expect(state.phase).toBe('PLAYER_TURN');
  });

  it('declares the mover the winner when their ninth die enters the goal', () => {
    // prettier-ignore
    const state = arrange(createInitialState(), [
      [0, 6], [1, 6], [0, 7], [1, 7], [2, 7], [0, 8], [1, 8], [2, 8], [3, 6],
      [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [3, 2], [4, 2], [5, 2], [6, 2]
    ]);
    startGame(state, 1);
    state.dice[8].quat = initialQuat(1, 1);
    selectDie(state, 8);
    moveTo(state, 2, 6);
    expect(completeTurn(state)).toMatchObject({ winner: 1 });
    expect(state).toMatchObject({ phase: 'WIN', winner: 1 });
    expect(advanceTurn(state)).toBeNull();
    expect(selectDie(state, 9)).toBe(false);
  });

  it('only checks the player who just moved', () => {
    // Ember already fills Moon's home, but only Moon's own corner count matters on Moon's turn.
    // prettier-ignore
    const state = arrange(createInitialState(), [
      [3, 3], [4, 3], [5, 3], [3, 4], [5, 4], [3, 5], [4, 5], [5, 5], [4, 1],
      [6, 0], [7, 0], [8, 0], [6, 1], [7, 1], [8, 1], [6, 2], [7, 2], [8, 2]
    ]);
    startGame(state, 1);
    state.dice[8].quat = initialQuat(1, 1);
    selectDie(state, 8);
    moveTo(state, 4, 0);
    expect(completeTurn(state)?.winner).toBeNull();
    expect(state.phase).toBe('TRANSITION');
  });
});

describe('reset and snapshots', () => {
  it('builds identical, independent fresh games', () => {
    const a = createInitialState();
    const b = createInitialState();
    expect(a).toEqual(b);
    a.dice[0].col = 4;
    a.dice[1].quat.x = 0.5;
    expect(b.dice[0].col).toBe(6);
    expect(b.dice[1].quat).toEqual(initialQuat(1, 1));
  });

  it('resets a played game in place to exactly the starting state', () => {
    const state = started(2);
    pickWithTop(state, 2, 6, 4);
    moveTo(state, 4, 4);
    completeTurn(state);
    advanceTurn(state);
    pickWithTop(state, 6, 2, 2);
    moveTo(state, 6, 3);
    const reference = state;
    resetGame(state);
    expect(state).toBe(reference);
    expect(state).toEqual(createInitialState());
  });

  it('lists the origin and every cell rolled through this turn as the trail', () => {
    const state = started(1);
    expect(trailCells(state)).toEqual([]);
    pickWithTop(state, 6, 2, 3);
    expect(trailCells(state)).toEqual([{ col: 6, row: 2 }]);
    moveTo(state, 6, 4);
    expect(trailCells(state)).toEqual([
      { col: 6, row: 2 },
      { col: 6, row: 3 },
      { col: 6, row: 4 }
    ]);
    undoStep(state);
    expect(trailCells(state)).toEqual([
      { col: 6, row: 2 },
      { col: 6, row: 3 }
    ]);
  });

  it('flags a pick with steps left but nowhere to go, like the classic blocked hint', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 2);
    expect(isSelectionBlocked(state)).toBe(false);
    Object.assign(state.dice[9], { col: 6, row: 3 });
    Object.assign(state.dice[10], { col: 5, row: 2 });
    expect(selectionReach(state).size).toBe(0);
    expect(isSelectionBlocked(state)).toBe(true);
    expect(state.selectedId).toBe(id);
  });

  it('snapshots a detached, serialisable view of the game', () => {
    const state = started(1);
    const id = pickWithTop(state, 6, 2, 3);
    moveTo(state, 6, 3);
    const snap = snapshotState(state);
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
    expect(snap).toMatchObject({
      phase: 'DIE_SELECTED',
      currentPlayer: 1,
      turnNumber: 1,
      winner: null,
      stepBudget: 3,
      stepsRemaining: 2,
      origin: { col: 6, row: 2 },
      path: [{ dir: 'NORTH', fromCol: 6, fromRow: 2 }],
      redoStack: [],
      selected: {
        id,
        player: 1,
        col: 6,
        row: 3,
        top: topFaceValue(state.dice[id].quat),
        cell: 'G4'
      },
      goals: { 1: 0, 2: 0 },
      canUndo: true,
      canRedo: false,
      blocked: false
    });
    expect(snap.dice).toHaveLength(18);
    expect(snap.dice[id]).toEqual({
      id,
      player: 1,
      col: 6,
      row: 3,
      top: snap.selected?.top,
      cell: 'G4',
      spawnValue: state.dice[id].spawnValue,
      quat: state.dice[id].quat,
      faces: { top: 2, bottom: 5, north: 3, south: 4, east: 6, west: 1 }
    });
    expect(snap.reachable).toContainEqual({ col: 6, row: 5, dist: 2 });
    expect(snap.trail).toEqual([
      { col: 6, row: 2 },
      { col: 6, row: 3 }
    ]);
    snap.dice[id].col = 0;
    snap.path.length = 0;
    snap.dice[id].quat.x = 99;
    expect(state.dice[id].quat.x).not.toBe(99);
    expect(state.dice[id].col).toBe(6);
    expect(state.path).toHaveLength(1);
  });
});
