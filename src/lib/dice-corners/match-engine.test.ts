import { describe, expect, it, vi } from 'vitest';
import {
  applyStep,
  completeTurn,
  createInitialState,
  initialQuat,
  rollQuat,
  selectDie,
  snapshotState,
  startGame,
  topFaceValue
} from '../../../static/dice-corners/game-logic.js';

import {
  createTestPlayer,
  runMatch,
  seededRandom,
  stateFromSnapshot,
  validateAction,
  validateRecord
} from '../../../static/dice-corners/match-engine.js';

import { createDemoPlayers, DEMO_SEED } from '../../../static/dice-corners/demo-match.js';

type Adapter = ReturnType<typeof createTestPlayer>;
type Record = Awaited<ReturnType<typeof runMatch>>;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const both = (player: Adapter): [Adapter, Adapter] => [player, player];

function started() {
  const state = createInitialState();
  startGame(state, 1);
  return state;
}

/** Eight Moon dice are home; a one-step west roll brings the ninth into its goal. */
function oneRollFromWin() {
  const state = started();
  const cells = [
    [0, 6],
    [1, 6],
    [0, 7],
    [1, 7],
    [2, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 6],
    [3, 3],
    [4, 3],
    [5, 3],
    [6, 3],
    [7, 3],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2]
  ];
  cells.forEach(([col, row], id) => Object.assign(state.dice[id], { col, row }));
  state.dice[8].quat = initialQuat(1, 1);
  return state;
}

/** A full top-two turn returns to its start in the mover's own home corner. */
function backtrackingState() {
  const state = started();
  state.dice[0].quat = initialQuat(2, 1);
  return state;
}

describe('authoritative full-path validation', () => {
  it.each([
    null,
    [],
    'NORTH',
    {},
    { dieId: '0', path: ['NORTH'] },
    { dieId: 0.5, path: ['NORTH'] },
    { dieId: -1, path: ['NORTH'] },
    { dieId: 99, path: ['NORTH'] },
    { dieId: 9, path: ['SOUTH'] },
    { dieId: 8, path: ['NORTH', 'NORTH', 'NORTH'] },
    { dieId: 0, path: ['UP'] },
    { dieId: 0, path: [] },
    { dieId: 0, path: ['NORTH', 'NORTH'] },
    { dieId: 0, path: ['EAST'] },
    { dieId: 2, path: ['EAST'] },
    { dieId: 0, path: ['NORTH'], destination: { col: 6, row: 3 } }
  ])('rejects malformed or illegal proposal %j without mutating authority', (proposal) => {
    const state = started();
    const before = clone(state);
    expect(validateAction(state, proposal).ok).toBe(false);
    expect(state).toEqual(before);
  });

  it('rejects sparse direction arrays rather than skipping missing rolls', () => {
    expect(validateAction(started(), { dieId: 0, path: new Array(1) }).ok).toBe(false);
  });

  it('rejects an illegal intermediate cell even if the endpoint is free', () => {
    const state = backtrackingState();
    expect(validateAction(state, { dieId: 0, path: ['EAST', 'NORTH'] }).ok).toBe(false);
  });

  it('keeps backtracking, revisited cells, and own-home camping legal', () => {
    const state = backtrackingState();
    const proposal = { dieId: 0, path: ['NORTH', 'SOUTH'] };
    const checked = validateAction(state, proposal);
    expect(checked).toEqual({ ok: true, action: proposal });
    if (!checked.ok) throw new Error('Expected a legal backtracking path');
    proposal.path[0] = 'WEST';
    expect(checked.action.path).toEqual(['NORTH', 'SOUTH']);
    selectDie(state, checked.action.dieId);
    state.phase = 'DIE_MOVING';
    checked.action.path.forEach((direction) => expect(applyStep(state, direction)).not.toBeNull());
    expect(completeTurn(state)?.winner).toBeNull();
    expect(state.dice[0]).toMatchObject({ col: 6, row: 2 });
  });

  it('allows the actual ninth-die winning move through the shared rules', () => {
    const state = oneRollFromWin();
    const checked = validateAction(state, { dieId: 8, path: ['WEST'] });
    expect(checked.ok).toBe(true);
    selectDie(state, 8);
    state.phase = 'DIE_MOVING';
    applyStep(state, 'WEST');
    expect(completeTurn(state)?.winner).toBe(1);
    expect(state.phase).toBe('WIN');
  });
});

describe('portable deterministic match records', () => {
  it('records a complete canonical 108-turn win and replays it without adapters', async () => {
    const record = await runMatch({ seed: DEMO_SEED, maxTurns: 120, players: createDemoPlayers() });
    expect(record.outcome).toMatchObject({ type: 'win', winner: 1, turns: 108 });
    expect(record.actions).toHaveLength(108);
    expect(record.frames.at(-1)?.state).toMatchObject({ phase: 'WIN', winner: 1, goals: { 1: 9 } });
    expect(
      record.frames.some((frame) => frame.event.type === 'turn-end' && frame.event.bonus)
    ).toBe(true);
    expect(validateRecord(clone(record))).toEqual({ valid: true, errors: [] });
    const fakeCutoff = clone(record);
    fakeCutoff.outcome.type = 'cutoff';
    fakeCutoff.outcome.winner = null;
    expect(validateRecord(fakeCutoff).valid).toBe(false);
  });

  it('repeats a seeded match byte for byte, including every roll and orientation', async () => {
    const options = { seed: 'repeatable', maxTurns: 40 };
    const a = await runMatch(options);
    const b = await runMatch(options);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(validateRecord(clone(a))).toEqual({ valid: true, errors: [] });
    expect(a.actions).toHaveLength(40);
    expect(a.frames.filter((frame) => frame.event.type === 'roll').length).toBeGreaterThan(40);
    expect(a.frames.at(-1)?.event.type).toBe('terminal');
  });

  it('uses deterministic independent seeds and varies across seeds', async () => {
    const randomA = seededRandom('abc');
    const randomB = seededRandom('abc');
    expect(Array.from({ length: 20 }, randomA)).toEqual(Array.from({ length: 20 }, randomB));
    const players = both(createTestPlayer('wander'));
    const a = await runMatch({ seed: 'a', maxTurns: 12, players });
    const b = await runMatch({ seed: 'b', maxTurns: 12, players });
    expect(a.actions).not.toEqual(b.actions);
    expect(validateRecord(a).valid).toBe(true);
    expect(validateRecord(b).valid).toBe(true);
  });

  it('labels a turn limit as cutoff with no winner or game-rule WIN phase', async () => {
    const record = await runMatch({ seed: 7, maxTurns: 1 });
    expect(record.outcome).toMatchObject({ type: 'cutoff', winner: null, turns: 1 });
    expect(record.frames.at(-1)?.state).toMatchObject({ winner: null, phase: 'PLAYER_TURN' });
    expect(validateRecord(record).valid).toBe(true);
    const fakeWinner = clone(record);
    fakeWinner.outcome = { type: 'win', winner: 1, reason: 'Fabricated', turns: 1 };
    expect(validateRecord(fakeWinner).valid).toBe(false);
  });

  it('preserves all six faces and a detached quaternion, not just the top face', async () => {
    const record = await runMatch({ seed: 'orientation', maxTurns: 12 });
    const frame = record.frames.find((entry) => entry.event.type === 'roll')!;
    for (const die of frame.state.dice) {
      expect(die.quat).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number),
          w: expect.any(Number)
        })
      );
      expect(Object.values(die.faces).sort()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(die.top).toBe(topFaceValue(die.quat));
    }
    const restored = stateFromSnapshot(frame.state);
    expect(snapshotState(restored)).toEqual(frame.state);
    restored.dice[0].quat.x = 99;
    restored.dice[0].col = 8;
    expect(frame.state.dice[0].quat.x).not.toBe(99);
  });

  it('captures the actual successive physical quaternion rotations', async () => {
    const record = await runMatch({ seed: 'physical', maxTurns: 10 });
    for (let index = 1; index < record.frames.length; index++) {
      const frame = record.frames[index];
      if (frame.event.type !== 'roll') continue;
      const dieId = frame.event.dieId as number;
      const direction = frame.event.direction as Parameters<typeof rollQuat>[1];
      const before = record.frames[index - 1].state.dice[dieId].quat;
      expect(frame.state.dice[dieId].quat).toEqual(rollQuat(before, direction));
    }
  });

  it('rejects changed actions, frame state, provenance, and missing frames', async () => {
    const record = await runMatch({ seed: 'tampering', maxTurns: 8 });
    const changes: ((copy: Record) => void)[] = [
      (copy) => {
        copy.actions[0].action.dieId = 99;
      },
      (copy) => {
        copy.actions[0].player = copy.actions[0].player === 1 ? 2 : 1;
      },
      (copy) => {
        copy.frames[0].state.dice[0].quat.y += 0.01;
      },
      (copy) => {
        copy.initialState.dice[0].quat.z += 0.01;
      },
      (copy) => {
        copy.frames.pop();
      },
      (copy) => {
        copy.openingRolls[0][0] = 0;
      },
      (copy) => {
        copy.rulesVersion = 'different-rules';
      },
      (copy) => {
        copy.baseCommit = 'different-base';
      },
      (copy) => {
        copy.outcome.turns--;
      }
    ];
    for (const change of changes) {
      const copy = clone(record);
      change(copy);
      expect(validateRecord(copy).valid).toBe(false);
    }
  });
});

describe('adapter authority boundary', () => {
  it('bounds a never-settling adapter and clears its timeout', async () => {
    vi.useFakeTimers();
    try {
      const pending: Adapter = {
        id: 'pending',
        name: 'Pending test adapter',
        kind: 'test',
        async chooseAction() {
          return new Promise(() => {});
        }
      };
      const completion = runMatch({ players: both(pending) });
      await vi.advanceTimersByTimeAsync(30_000);
      const record = await completion;
      expect(record.outcome).toMatchObject({ type: 'adapter-failure', winner: null, turns: 0 });
      expect(record.outcome.reason).toContain('timed out');
      expect(validateRecord(record).valid).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('turns an exception into a replayable failure, without awarding the opponent a win', async () => {
    const broken: Adapter = {
      id: 'broken',
      name: 'Broken test adapter',
      kind: 'test',
      async chooseAction() {
        throw new Error('Test failure');
      }
    };
    const record = await runMatch({ seed: 'failure', players: both(broken) });
    expect(record.outcome).toMatchObject({
      type: 'adapter-failure',
      winner: null,
      turns: 0,
      reason: 'Test failure'
    });
    expect(record.actions).toEqual([]);
    expect(validateRecord(record)).toEqual({ valid: true, errors: [] });
  });

  it('rejects invalid adapter moves before any select or roll frame is committed', async () => {
    const invalid: Adapter = {
      id: 'invalid',
      name: 'Invalid test adapter',
      kind: 'test',
      async chooseAction() {
        return { dieId: 999, path: ['NORTH'] };
      }
    };
    const record = await runMatch({ maxTurns: 2, players: both(invalid) });
    expect(record.outcome.type).toBe('adapter-failure');
    expect(record.actions).toEqual([]);
    expect(record.frames.some((frame) => ['select', 'roll'].includes(frame.event.type))).toBe(
      false
    );
    expect(validateRecord(record).valid).toBe(true);
  });

  it('deep-freezes observations and contains attempted nested mutation', async () => {
    const mutation: Adapter = {
      id: 'mutation',
      name: 'Mutation test adapter',
      kind: 'test',
      async chooseAction(observation) {
        expect(Object.isFrozen(observation)).toBe(true);
        expect(Object.isFrozen(observation.state.dice[0].quat)).toBe(true);
        observation.state.dice[0].quat.x = 999;
        return { dieId: 0, path: ['NORTH'] };
      }
    };
    const record = await runMatch({ players: both(mutation) });
    expect(record.outcome.type).toBe('adapter-failure');
    expect(record.frames.at(-1)?.state.dice[0].quat).toEqual(record.initialState.dice[0].quat);
    expect(validateRecord(record).valid).toBe(true);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.frames[0].state.dice[0].quat)).toBe(true);
  });

  it.each([0, -1, 1.5, 10001, Infinity, NaN])('rejects invalid turn bound %s', async (maxTurns) => {
    await expect(runMatch({ maxTurns })).rejects.toThrow('maxTurns');
  });

  it('rejects non-finite seeds and unknown test policies', async () => {
    await expect(runMatch({ seed: Infinity })).rejects.toThrow('Seed');
    expect(() => createTestPlayer('unknown' as 'wander')).toThrow();
  });
});
