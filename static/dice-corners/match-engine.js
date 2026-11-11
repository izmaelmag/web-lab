// Headless, authoritative match runner. Adapters propose paths; only this engine
// can mutate the board. No provider, network, credential, or renderer dependency.
import {
  DIRECTION_NAMES,
  DIRECTIONS,
  PHASE,
  advanceTurn,
  applyStep,
  canSelectDie,
  cellKey,
  completeTurn,
  createInitialState,
  goalCells,
  inBounds,
  isGoalCell,
  occupiedKeys,
  playerHasMove,
  rollForFirstPlayer,
  selectDie,
  snapshotState,
  startGame,
  topFaceValue
} from './game-logic.js';

export const RULES_VERSION = 'dice-corners-classic-v1';
export const BASE_COMMIT = 'a38bbc47099e621b9a468f54cd4637caad9aae28';
/** @typedef {import('./game-logic.js').GameState} GameState */
/** @typedef {import('./game-logic.js').Direction} Direction */
/** @typedef {import('./game-logic.js').Player} Player */
/** @typedef {ReturnType<typeof snapshotState>} Snapshot */
/** @typedef {{dieId:number,path:Direction[]}} Action */
/** @typedef {{state:Snapshot,player:Player,seed:string|number,turnNumber:number,decisionSeed:string}} Observation */
/** @typedef {{id:string,name:string,kind:string,chooseAction:(observation:Observation)=>Promise<unknown>}} PlayerAdapter */
/** @typedef {{type:string,[key:string]:unknown}} MatchEvent */
/** @typedef {{index:number,state:Snapshot,event:MatchEvent,turnNumber:number,player:Player,actionIndex?:number}} Frame */
/** @typedef {{type:'win'|'cutoff'|'adapter-failure',winner:Player|null,reason:string,turns:number,player?:Player}} Outcome */
/** @typedef {{turnNumber:number,player:Player,action:Action}} RecordedAction */
/** @typedef {{schemaVersion:1,rulesVersion:string,baseCommit:string,seed:string|number,maxTurns:number,players:{id:string,name:string,kind:string}[],openingRolls:[number,number][],initialState:Snapshot,actions:RecordedAction[],frames:Frame[],outcome:Outcome}} MatchRecord */

/** Stable portable PRNG, with separate streams for opening and each decision.
 * @param {string|number} seed
 * @returns {()=>number}
 */
export function seededRandom(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => {
    value += 0x6d2b79f5;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Freeze every nested object; no live authority escapes to an adapter.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

/** Restore authoritative fields from a detached snapshot.
 * @param {Snapshot} snapshot
 * @returns {GameState}
 */
export function stateFromSnapshot(snapshot) {
  return {
    phase: snapshot.phase,
    currentPlayer: snapshot.currentPlayer,
    turnNumber: snapshot.turnNumber,
    winner: snapshot.winner,
    selectedId: snapshot.selectedId,
    stepBudget: snapshot.stepBudget,
    stepsRemaining: snapshot.stepsRemaining,
    origin: snapshot.origin ? { ...snapshot.origin } : null,
    path: snapshot.path.map((step) => ({ ...step })),
    redoStack: [...snapshot.redoStack],
    dice: snapshot.dice.map((die) => ({
      id: die.id,
      player: die.player,
      col: die.col,
      row: die.row,
      spawnValue: die.spawnValue,
      quat: { ...die.quat }
    }))
  };
}

/** Strictly validate the complete path against a disposable rules state.
 * Returning to a visited cell, reversing, and staying in home remain legal.
 * A destination never substitutes for a direction sequence.
 * @param {GameState} state
 * @param {unknown} proposed
 * @returns {{ok:true,action:Action}|{ok:false,reason:string}}
 */
export function validateAction(state, proposed) {
  if (!proposed || typeof proposed !== 'object' || Array.isArray(proposed))
    return { ok: false, reason: 'Action must be an object with dieId and path.' };
  const candidate = /** @type {Record<string,unknown>} */ (proposed);
  if (Object.keys(candidate).some((key) => key !== 'dieId' && key !== 'path'))
    return { ok: false, reason: 'Only dieId and path are accepted; no destination shortcuts.' };
  if (
    typeof candidate.dieId !== 'number' ||
    !Number.isInteger(candidate.dieId) ||
    !Array.isArray(candidate.path) ||
    candidate.path.length > 6 ||
    !Array.from(candidate.path).every((dir) => DIRECTION_NAMES.includes(dir))
  )
    return { ok: false, reason: 'Invalid die identifier or direction path.' };
  const action = { dieId: candidate.dieId, path: /** @type {Direction[]} */ ([...candidate.path]) };
  const trial = stateFromSnapshot(snapshotState(state));
  if (!selectDie(trial, action.dieId))
    return { ok: false, reason: 'Die is not selectable on this turn.' };
  if (action.path.length !== trial.stepBudget)
    return { ok: false, reason: `Path must spend exactly ${trial.stepBudget} rolls.` };
  trial.phase = PHASE.DIE_MOVING;
  for (const direction of action.path) {
    if (!applyStep(trial, direction))
      return { ok: false, reason: 'Path enters an occupied or out-of-bounds cell.' };
  }
  return { ok: true, action };
}

/** Deterministic, explicitly labeled local test policies, not model providers.
 * @param {'goal-seeking'|'wander'} style
 * @returns {PlayerAdapter}
 */
export function createTestPlayer(style) {
  if (style !== 'goal-seeking' && style !== 'wander') throw new Error('Unknown test-player style.');
  return {
    id: `test-${style}`,
    name: style === 'goal-seeking' ? 'Goal-seeking test bot' : 'Wander test bot',
    kind: 'test',
    async chooseAction(observation) {
      const state = stateFromSnapshot(observation.state);
      const random = seededRandom(observation.decisionSeed);
      const dice = state.dice.filter((die) => canSelectDie(state, die.id));
      if (!dice.length) throw new Error('No legal die; engine should forfeit this turn.');
      if (style === 'wander') {
        const die = dice[Math.floor(random() * dice.length)];
        const occupied = occupiedKeys(state, die.id);
        let col = die.col,
          row = die.row;
        /** @type {Direction[]} */
        const path = [];
        for (let step = 0; step < topFaceValue(die.quat); step++) {
          const legal = DIRECTION_NAMES.filter(
            (dir) =>
              inBounds(col + DIRECTIONS[dir].dc, row + DIRECTIONS[dir].dr) &&
              !occupied.has(cellKey(col + DIRECTIONS[dir].dc, row + DIRECTIONS[dir].dr))
          );
          const dir = legal[Math.floor(random() * legal.length)];
          path.push(dir);
          col += DIRECTIONS[dir].dc;
          row += DIRECTIONS[dir].dr;
        }
        return { dieId: die.id, path };
      }
      /** @type {Action|null} */
      let best = null;
      let bestScore = -Infinity,
        ties = 0;
      for (const die of dice) {
        const occupied = occupiedKeys(state, die.id);
        const targets = goalCells(die.player).filter(
          (cell) =>
            !state.dice.some(
              (other) =>
                other.id !== die.id &&
                other.player === die.player &&
                other.col === cell.col &&
                other.row === cell.row
            )
        );
        /** @param {number} col @param {number} row */
        const distance = (col, row) =>
          Math.min(...targets.map((cell) => Math.abs(col - cell.col) + Math.abs(row - cell.row)));
        const before = distance(die.col, die.row);
        const wasGoal = isGoalCell(die.player, die.col, die.row);
        /** @type {Direction[]} */
        const path = [];
        /** Enumerate ordered full paths, not BFS destinations. @param {number} col @param {number} row @param {number} left */
        function visit(col, row, left) {
          if (!left) {
            const inGoal = isGoalCell(die.player, col, row);
            const depth = die.player === 1 ? row - col : col - row;
            const score =
              (before - distance(col, row)) * 10 +
              (Number(inGoal) - Number(wasGoal)) * 60 +
              (inGoal ? depth * 0.2 : 0) -
              (wasGoal ? 2 : 0);
            if (score > bestScore) {
              bestScore = score;
              ties = 0;
            }
            if (score === bestScore && random() < 1 / ++ties)
              best = { dieId: die.id, path: [...path] };
            return;
          }
          for (const dir of DIRECTION_NAMES) {
            const nextCol = col + DIRECTIONS[dir].dc,
              nextRow = row + DIRECTIONS[dir].dr;
            if (!inBounds(nextCol, nextRow) || occupied.has(cellKey(nextCol, nextRow))) continue;
            path.push(dir);
            visit(nextCol, nextRow, left - 1);
            path.pop();
          }
        }
        visit(die.col, die.row, topFaceValue(die.quat));
      }
      if (!best) throw new Error('No full legal path.');
      return best;
    }
  };
}

/** @param {MatchRecord} record @param {GameState} state @param {MatchEvent} event @param {number} [actionIndex] */
function frame(record, state, event, actionIndex) {
  record.frames.push({
    index: record.frames.length,
    state: snapshotState(state),
    event,
    turnNumber: state.turnNumber,
    player: state.currentPlayer,
    ...(actionIndex === undefined ? {} : { actionIndex })
  });
}

/** @param {MatchRecord} record @param {GameState} state @param {Action} action */
function commitAction(record, state, action) {
  const actionIndex = record.actions.length;
  record.actions.push({
    turnNumber: state.turnNumber,
    player: state.currentPlayer,
    action: { dieId: action.dieId, path: [...action.path] }
  });
  selectDie(state, action.dieId);
  frame(
    record,
    state,
    { type: 'select', dieId: action.dieId, budget: state.stepBudget },
    actionIndex
  );
  state.phase = PHASE.DIE_MOVING;
  for (const direction of action.path) {
    const step = applyStep(state, direction);
    if (!step) throw new Error('Validated action failed during authoritative execution.');
    frame(record, state, { type: 'roll', ...step }, actionIndex);
  }
  const result = completeTurn(state);
  frame(record, state, { type: 'turn-end', ...result }, actionIndex);
  if (!state.winner) {
    advanceTurn(state);
    frame(record, state, { type: 'advance' }, actionIndex);
  }
}

/** @param {string|number} seed @param {number} maxTurns @param {MatchRecord['players']} players */
function initialize(seed, maxTurns, players) {
  const state = createInitialState();
  /** @type {MatchRecord} */
  const record = {
    schemaVersion: 1,
    rulesVersion: RULES_VERSION,
    baseCommit: BASE_COMMIT,
    seed,
    maxTurns,
    players,
    openingRolls: [],
    initialState: snapshotState(state),
    actions: [],
    frames: [],
    outcome: {
      type: 'cutoff',
      winner: null,
      reason: 'Turn limit reached; no winner declared.',
      turns: 0
    }
  };
  frame(record, state, { type: 'initial' });
  const opening = rollForFirstPlayer(seededRandom(`${seed}:opening`));
  record.openingRolls = opening.rolls;
  for (const [moon, ember] of opening.rolls)
    frame(record, state, { type: 'opening', moon, ember, tie: moon === ember });
  startGame(state, opening.firstPlayer);
  frame(record, state, { type: 'start', firstPlayer: opening.firstPlayer });
  return { record, state };
}

/** Adapter timeout prevents a never-settling player from hanging a match.
 * This only bounds execution; timing never alters a successful action or record.
 * @param {PlayerAdapter} adapter
 * @param {Observation} observation
 * @returns {Promise<unknown>}
 */
async function requestAction(adapter, observation) {
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => adapter.chooseAction(observation)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Adapter timed out after 30 seconds.')), 30000);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Run bounded local or user-supplied async adapters. Invalid actions and adapter
 * exceptions stop with a distinct failure outcome, never an invented winner.
 * @param {{seed?:string|number,maxTurns?:number,players?:[PlayerAdapter,PlayerAdapter]}} [options]
 * @returns {Promise<MatchRecord>}
 */
export async function runMatch({
  seed = 'dice-corners-demo',
  maxTurns = 120,
  players = [createTestPlayer('goal-seeking'), createTestPlayer('wander')]
} = {}) {
  if (
    (typeof seed !== 'string' && typeof seed !== 'number') ||
    (typeof seed === 'number' && !Number.isFinite(seed))
  )
    throw new Error('Seed must be a string or finite number.');
  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 10000)
    throw new Error('maxTurns must be 1–10000.');
  if (
    players.length !== 2 ||
    players.some(
      (player) =>
        !player ||
        typeof player.chooseAction !== 'function' ||
        !['id', 'name', 'kind'].every(
          (key) => typeof player[/** @type {'id'|'name'|'kind'} */ (key)] === 'string'
        )
    )
  )
    throw new Error('Exactly two named player adapters are required.');
  const { record, state } = initialize(
    seed,
    maxTurns,
    players.map(({ id, name, kind }) => ({ id, name, kind }))
  );
  for (let turns = 0; turns < maxTurns; turns++) {
    if (!playerHasMove(state)) {
      frame(record, state, { type: 'forfeit', reason: 'No movable die.' });
      advanceTurn(state);
      frame(record, state, { type: 'advance' });
      record.outcome.turns = turns + 1;
      continue;
    }
    try {
      const observation = freezeDeep({
        state: snapshotState(state),
        player: state.currentPlayer,
        seed,
        turnNumber: state.turnNumber,
        decisionSeed: `${seed}:player:${state.currentPlayer}:turn:${state.turnNumber}`
      });
      const proposed = await requestAction(players[state.currentPlayer - 1], observation);
      const validation = validateAction(state, proposed);
      if (!validation.ok) throw new Error(validation.reason);
      commitAction(record, state, validation.action);
      record.outcome.turns = turns + 1;
      if (state.winner) {
        record.outcome = {
          type: 'win',
          winner: state.winner,
          reason: 'All nine dice reached the opposite home.',
          turns: turns + 1
        };
        break;
      }
    } catch (error) {
      record.outcome = {
        type: 'adapter-failure',
        winner: null,
        player: state.currentPlayer,
        reason: error instanceof Error ? error.message : 'Adapter failed.',
        turns
      };
      break;
    }
    // Let browser controls paint between small batches. No clock enters the record.
    if (turns % 8 === 7) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  frame(record, state, { ...record.outcome, type: 'terminal', outcomeType: record.outcome.type });
  return freezeDeep(record);
}

/** Replay recorded actions through the rules and compare every recorded frame.
 * Does not call adapters or trust recorded orientations, winners, or positions.
 * Failure text is metadata; failure's absence of a successful action is checked.
 * @param {MatchRecord} record
 * @returns {{valid:boolean,errors:string[]}}
 */
export function validateRecord(record) {
  try {
    if (
      record.schemaVersion !== 1 ||
      record.rulesVersion !== RULES_VERSION ||
      record.baseCommit !== BASE_COMMIT
    )
      throw new Error('Unsupported record provenance.');
    if (
      !Number.isInteger(record.maxTurns) ||
      record.maxTurns < 1 ||
      record.maxTurns > 10000 ||
      !Number.isInteger(record.outcome.turns) ||
      record.outcome.turns < 0 ||
      record.outcome.turns > record.maxTurns ||
      !Array.isArray(record.players) ||
      record.players.length !== 2 ||
      (typeof record.seed !== 'string' && typeof record.seed !== 'number') ||
      (typeof record.seed === 'number' && !Number.isFinite(record.seed))
    )
      throw new Error('Invalid record bounds or seed.');
    const rebuilt = initialize(record.seed, record.maxTurns, record.players);
    let actionIndex = 0,
      turns = 0;
    while (turns < record.outcome.turns) {
      if (!playerHasMove(rebuilt.state)) {
        frame(rebuilt.record, rebuilt.state, { type: 'forfeit', reason: 'No movable die.' });
        advanceTurn(rebuilt.state);
        frame(rebuilt.record, rebuilt.state, { type: 'advance' });
      } else {
        const entry = record.actions[actionIndex++];
        if (
          !entry ||
          entry.player !== rebuilt.state.currentPlayer ||
          entry.turnNumber !== rebuilt.state.turnNumber
        )
          throw new Error('Action order or player mismatch.');
        const check = validateAction(rebuilt.state, entry.action);
        if (!check.ok) throw new Error(check.reason);
        commitAction(rebuilt.record, rebuilt.state, check.action);
      }
      turns++;
      if (rebuilt.state.winner && turns !== record.outcome.turns)
        throw new Error('Actions follow a win.');
    }
    if (actionIndex !== record.actions.length) throw new Error('Unconsumed recorded actions.');
    if (
      record.outcome.type === 'win' &&
      (!rebuilt.state.winner || rebuilt.state.winner !== record.outcome.winner)
    )
      throw new Error('Winner mismatch.');
    if (
      record.outcome.type === 'cutoff' &&
      (turns !== record.maxTurns || rebuilt.state.winner || record.outcome.winner !== null)
    )
      throw new Error('Invalid cutoff.');
    if (
      record.outcome.type === 'adapter-failure' &&
      (rebuilt.state.winner ||
        record.outcome.winner !== null ||
        turns >= record.maxTurns ||
        record.outcome.player !== rebuilt.state.currentPlayer)
    )
      throw new Error('Invalid adapter failure.');
    if (!['win', 'cutoff', 'adapter-failure'].includes(record.outcome.type))
      throw new Error('Unknown outcome.');
    frame(rebuilt.record, rebuilt.state, {
      ...record.outcome,
      type: 'terminal',
      outcomeType: record.outcome.type
    });
    if (
      JSON.stringify(rebuilt.record.initialState) !== JSON.stringify(record.initialState) ||
      JSON.stringify(rebuilt.record.openingRolls) !== JSON.stringify(record.openingRolls) ||
      JSON.stringify(rebuilt.record.frames) !== JSON.stringify(record.frames)
    )
      throw new Error('Recorded frame differs from authoritative replay.');
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : 'Malformed record.'] };
  }
}
