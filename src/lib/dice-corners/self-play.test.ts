import { describe, expect, it } from 'vitest';
import {
  advanceTurn,
  applyStep,
  beginMove,
  canRedo,
  canSelectDie,
  canUndo,
  cellKey,
  completeTurn,
  createInitialState,
  finishMove,
  inBounds,
  occupiedKeys,
  playerHasMove,
  redoStep,
  rollForFirstPlayer,
  selectDie,
  selectedDie,
  selectionReach,
  startGame,
  topFaceValue,
  undoStep
} from '../../../static/dice-corners/game-logic.js';
import { loadClassicOracle } from './classic-oracle';
import { componentDelta, pick, seededRandom } from './test-utils';

type State = ReturnType<typeof createInitialState>;
type Step = NonNullable<ReturnType<typeof applyStep>>;

const classic = loadClassicOracle();

function expectBoardInvariants(state: State) {
  const cells = new Set(state.dice.map((d) => cellKey(d.col, d.row)));
  expect(cells.size).toBe(18);
  for (const die of state.dice) expect(inBounds(die.col, die.row)).toBe(true);
  expect(state.stepsRemaining).toBeGreaterThanOrEqual(0);
  if (state.selectedId !== null) {
    expect(state.path.length + state.stepsRemaining).toBe(state.stepBudget);
  }
}

describe('seeded self-play', () => {
  it('keeps every invariant and shadows the classic rules roll for roll', () => {
    let rolls = 0;
    let undos = 0;
    let redos = 0;
    let bonuses = 0;
    for (let game = 0; game < 30; game++) {
      const random = seededRandom(1000 + game);
      const state = createInitialState();
      // A parallel copy of every orientation, driven only by the classic functions.
      const shadow = state.dice.map((d) => classic.initialQuat(d.spawnValue, d.player));
      const follow = (step: Step) => {
        shadow[step.dieId] = classic.rollDie(shadow[step.dieId], step.direction);
        expect(componentDelta(state.dice[step.dieId].quat, shadow[step.dieId])).toBeLessThan(1e-9);
        rolls++;
      };
      startGame(state, rollForFirstPlayer(random).firstPlayer);

      for (let turn = 0; turn < 120 && state.phase !== 'WIN'; turn++) {
        if (!playerHasMove(state)) {
          expect(advanceTurn(state)).not.toBeNull();
          continue;
        }
        const movable = state.dice.filter((d) => canSelectDie(state, d.id));
        expect(movable.length).toBeGreaterThan(0);
        const picked = pick(movable, random);
        expect(selectDie(state, picked.id)).toBe(true);
        expect(state.stepBudget).toBe(classic.topFaceValue(shadow[picked.id]));

        for (let guard = 0; guard < 50; guard++) {
          const die = selectedDie(state)!;
          const reach = selectionReach(state);
          const classicReach = classic.getReachableCells(
            die,
            state.stepsRemaining,
            occupiedKeys(state, die.id)
          );
          expect([...reach.entries()]).toEqual([...classicReach.entries()]);

          const roll = random();
          if (roll < 0.15 && canUndo(state)) {
            follow(undoStep(state)!);
            undos++;
            continue;
          }
          if (roll < 0.3 && canRedo(state)) {
            follow(redoStep(state)!);
            redos++;
          } else {
            const [target, node] = pick([...reach.entries()], random);
            const path = beginMove(state, node.col, node.row)!;
            expect(path).toEqual(classic.reconstructPath(classicReach, die, target));
            for (const direction of path) follow(applyStep(state, direction)!);
          }
          expectBoardInvariants(state);
          if (finishMove(state) === 'turn-complete') break;
        }

        const result = completeTurn(state)!;
        expect(result).not.toBeNull();
        if (result.bonus) {
          bonuses++;
          const die = state.dice[result.dieId];
          shadow[die.id] = classic.initialQuat(6, die.player);
          expect(topFaceValue(die.quat)).toBe(6);
        }
        for (const die of state.dice) {
          expect(componentDelta(die.quat, shadow[die.id])).toBeLessThan(1e-9);
          expect(topFaceValue(die.quat)).toBe(classic.topFaceValue(shadow[die.id]));
        }
        if (result.winner) {
          expect(classic.checkWin(state.dice, result.winner)).toBe(true);
          break;
        }
        expect(advanceTurn(state)).not.toBeNull();
      }
    }
    // The run must actually exercise the interesting paths.
    expect(rolls).toBeGreaterThan(2000);
    expect(undos).toBeGreaterThan(50);
    expect(redos).toBeGreaterThan(20);
    expect(bonuses).toBeGreaterThan(0);
  }, 15_000);
});
