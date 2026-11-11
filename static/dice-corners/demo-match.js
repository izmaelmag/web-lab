// A transparent scripted test fixture, not a model or the goal-seeking policy.
// Every action is validated and executed by match-engine.js from the canonical
// initial board; this module cannot inject states, frames, or a winner.

export const DEMO_SEED = 5;
export const DEMO_TURNS = 108;

/** @type {{turn:number,player:import('./game-logic.js').Player,id:number,from:string,budget:number,dirs:import('./game-logic.js').Direction[]}[]} */
const SCRIPT = [
  { turn: 1, player: 2, id: 11, from: 'C7', budget: 1, dirs: ['EAST'] },
  { turn: 2, player: 1, id: 0, from: 'G3', budget: 1, dirs: ['WEST'] },
  { turn: 3, player: 2, id: 11, from: 'D7', budget: 3, dirs: ['EAST', 'SOUTH', 'SOUTH'] },
  { turn: 4, player: 1, id: 0, from: 'F3', budget: 3, dirs: ['NORTH', 'SOUTH', 'WEST'] },
  {
    turn: 5,
    player: 2,
    id: 11,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'EAST', 'SOUTH', 'SOUTH']
  },
  {
    turn: 6,
    player: 1,
    id: 0,
    from: 'E3',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'NORTH', 'NORTH', 'WEST']
  },
  { turn: 7, player: 2, id: 14, from: 'C8', budget: 1, dirs: ['EAST'] },
  {
    turn: 8,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  { turn: 9, player: 2, id: 14, from: 'D8', budget: 3, dirs: ['EAST', 'EAST', 'EAST'] },
  {
    turn: 10,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'SOUTH', 'EAST', 'SOUTH', 'WEST']
  },
  { turn: 11, player: 2, id: 13, from: 'B8', budget: 2, dirs: ['EAST', 'EAST'] },
  {
    turn: 12,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'SOUTH', 'WEST', 'SOUTH', 'EAST']
  },
  {
    turn: 13,
    player: 2,
    id: 13,
    from: 'D8',
    budget: 5,
    dirs: ['SOUTH', 'EAST', 'EAST', 'EAST', 'EAST']
  },
  {
    turn: 14,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'WEST', 'SOUTH', 'EAST', 'SOUTH']
  },
  { turn: 15, player: 2, id: 17, from: 'C9', budget: 1, dirs: ['EAST'] },
  {
    turn: 16,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'NORTH', 'WEST', 'SOUTH']
  },
  { turn: 17, player: 2, id: 17, from: 'D9', budget: 3, dirs: ['EAST', 'EAST', 'EAST'] },
  {
    turn: 18,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'EAST', 'SOUTH', 'WEST', 'SOUTH']
  },
  { turn: 19, player: 2, id: 16, from: 'B9', budget: 2, dirs: ['EAST', 'EAST'] },
  {
    turn: 20,
    player: 1,
    id: 0,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'WEST', 'WEST', 'NORTH']
  },
  {
    turn: 21,
    player: 2,
    id: 16,
    from: 'D9',
    budget: 5,
    dirs: ['SOUTH', 'EAST', 'SOUTH', 'EAST', 'EAST']
  },
  {
    turn: 22,
    player: 1,
    id: 0,
    from: 'C9',
    budget: 6,
    dirs: ['SOUTH', 'EAST', 'SOUTH', 'WEST', 'NORTH', 'WEST']
  },
  { turn: 23, player: 2, id: 15, from: 'A9', budget: 3, dirs: ['EAST', 'EAST', 'EAST'] },
  {
    turn: 24,
    player: 1,
    id: 0,
    from: 'B8',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'NORTH', 'WEST', 'WEST']
  },
  { turn: 25, player: 2, id: 15, from: 'D9', budget: 1, dirs: ['EAST'] },
  { turn: 26, player: 1, id: 3, from: 'G2', budget: 1, dirs: ['WEST'] },
  { turn: 27, player: 2, id: 15, from: 'E9', budget: 3, dirs: ['SOUTH', 'NORTH', 'EAST'] },
  { turn: 28, player: 1, id: 3, from: 'F2', budget: 3, dirs: ['NORTH', 'NORTH', 'WEST'] },
  {
    turn: 29,
    player: 2,
    id: 15,
    from: 'F9',
    budget: 6,
    dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'EAST', 'EAST', 'SOUTH']
  },
  {
    turn: 30,
    player: 1,
    id: 3,
    from: 'E4',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'WEST', 'WEST', 'NORTH']
  },
  { turn: 31, player: 2, id: 10, from: 'B7', budget: 1, dirs: ['EAST'] },
  {
    turn: 32,
    player: 1,
    id: 3,
    from: 'C8',
    budget: 6,
    dirs: ['NORTH', 'WEST', 'SOUTH', 'EAST', 'NORTH', 'WEST']
  },
  { turn: 33, player: 2, id: 10, from: 'C7', budget: 3, dirs: ['EAST', 'EAST', 'EAST'] },
  {
    turn: 34,
    player: 1,
    id: 3,
    from: 'B9',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST']
  },
  { turn: 35, player: 2, id: 10, from: 'F7', budget: 1, dirs: ['NORTH'] },
  {
    turn: 36,
    player: 1,
    id: 3,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  {
    turn: 37,
    player: 2,
    id: 10,
    from: 'F8',
    budget: 5,
    dirs: ['WEST', 'SOUTH', 'EAST', 'SOUTH', 'EAST']
  },
  {
    turn: 38,
    player: 1,
    id: 3,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'NORTH', 'NORTH', 'WEST']
  },
  { turn: 39, player: 2, id: 12, from: 'A8', budget: 2, dirs: ['EAST', 'EAST'] },
  {
    turn: 40,
    player: 1,
    id: 3,
    from: 'B9',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'SOUTH', 'NORTH', 'SOUTH', 'WEST']
  },
  {
    turn: 41,
    player: 2,
    id: 12,
    from: 'C8',
    budget: 5,
    dirs: ['EAST', 'NORTH', 'EAST', 'SOUTH', 'EAST']
  },
  { turn: 42, player: 1, id: 4, from: 'H2', budget: 2, dirs: ['WEST', 'WEST'] },
  {
    turn: 43,
    player: 2,
    id: 12,
    from: 'F8',
    budget: 6,
    dirs: ['SOUTH', 'WEST', 'SOUTH', 'EAST', 'SOUTH', 'EAST']
  },
  {
    turn: 44,
    player: 1,
    id: 4,
    from: 'F2',
    budget: 5,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'NORTH', 'NORTH']
  },
  { turn: 45, player: 2, id: 9, from: 'A7', budget: 1, dirs: ['EAST'] },
  {
    turn: 46,
    player: 1,
    id: 4,
    from: 'F7',
    budget: 6,
    dirs: ['NORTH', 'WEST', 'WEST', 'NORTH', 'WEST', 'WEST']
  },
  { turn: 47, player: 2, id: 9, from: 'B7', budget: 3, dirs: ['EAST', 'EAST', 'EAST'] },
  { turn: 48, player: 1, id: 1, from: 'H3', budget: 1, dirs: ['NORTH'] },
  { turn: 49, player: 2, id: 9, from: 'E7', budget: 1, dirs: ['EAST'] },
  { turn: 50, player: 1, id: 1, from: 'H4', budget: 2, dirs: ['WEST', 'WEST'] },
  { turn: 51, player: 2, id: 9, from: 'F7', budget: 3, dirs: ['NORTH', 'NORTH', 'SOUTH'] },
  {
    turn: 52,
    player: 1,
    id: 1,
    from: 'F4',
    budget: 5,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'WEST', 'WEST']
  },
  {
    turn: 53,
    player: 2,
    id: 9,
    from: 'F8',
    budget: 5,
    dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'SOUTH', 'EAST']
  },
  {
    turn: 54,
    player: 1,
    id: 1,
    from: 'D7',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'SOUTH', 'WEST', 'WEST', 'SOUTH']
  },
  { turn: 55, player: 2, id: 14, from: 'G8', budget: 1, dirs: ['EAST'] },
  {
    turn: 56,
    player: 1,
    id: 1,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  {
    turn: 57,
    player: 2,
    id: 9,
    from: 'G4',
    budget: 6,
    dirs: ['WEST', 'NORTH', 'NORTH', 'NORTH', 'NORTH', 'EAST']
  },
  {
    turn: 58,
    player: 1,
    id: 1,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'NORTH', 'EAST', 'SOUTH', 'WEST']
  },
  {
    turn: 59,
    player: 2,
    id: 10,
    from: 'G6',
    budget: 6,
    dirs: ['EAST', 'EAST', 'NORTH', 'NORTH', 'NORTH', 'SOUTH']
  },
  {
    turn: 60,
    player: 1,
    id: 1,
    from: 'B7',
    budget: 5,
    dirs: ['SOUTH', 'SOUTH', 'WEST', 'NORTH', 'NORTH']
  },
  { turn: 61, player: 2, id: 14, from: 'H8', budget: 3, dirs: ['NORTH', 'SOUTH', 'NORTH'] },
  { turn: 62, player: 1, id: 5, from: 'I2', budget: 2, dirs: ['WEST', 'NORTH'] },
  {
    turn: 63,
    player: 2,
    id: 9,
    from: 'G8',
    budget: 6,
    dirs: ['WEST', 'WEST', 'SOUTH', 'EAST', 'NORTH', 'EAST']
  },
  {
    turn: 64,
    player: 1,
    id: 5,
    from: 'H3',
    budget: 6,
    dirs: ['NORTH', 'WEST', 'WEST', 'NORTH', 'NORTH', 'NORTH']
  },
  {
    turn: 65,
    player: 2,
    id: 14,
    from: 'H9',
    budget: 5,
    dirs: ['SOUTH', 'NORTH', 'SOUTH', 'NORTH', 'SOUTH']
  },
  {
    turn: 66,
    player: 1,
    id: 5,
    from: 'F7',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'WEST', 'WEST', 'WEST', 'WEST']
  },
  {
    turn: 67,
    player: 2,
    id: 10,
    from: 'I8',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'NORTH', 'SOUTH', 'NORTH', 'WEST']
  },
  {
    turn: 68,
    player: 1,
    id: 5,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  { turn: 69, player: 2, id: 14, from: 'H8', budget: 3, dirs: ['EAST', 'NORTH', 'SOUTH'] },
  {
    turn: 70,
    player: 1,
    id: 5,
    from: 'B7',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'EAST', 'NORTH', 'WEST']
  },
  {
    turn: 71,
    player: 2,
    id: 13,
    from: 'H7',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'SOUTH', 'WEST', 'NORTH']
  },
  {
    turn: 72,
    player: 1,
    id: 5,
    from: 'C8',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  { turn: 73, player: 2, id: 13, from: 'H7', budget: 4, dirs: ['EAST', 'SOUTH', 'WEST', 'NORTH'] },
  {
    turn: 74,
    player: 1,
    id: 5,
    from: 'C8',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'EAST', 'NORTH', 'WEST', 'SOUTH']
  },
  {
    turn: 75,
    player: 2,
    id: 11,
    from: 'G3',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'EAST', 'NORTH', 'NORTH', 'NORTH']
  },
  {
    turn: 76,
    player: 1,
    id: 5,
    from: 'C8',
    budget: 5,
    dirs: ['EAST', 'SOUTH', 'WEST', 'NORTH', 'WEST']
  },
  {
    turn: 77,
    player: 2,
    id: 12,
    from: 'G5',
    budget: 6,
    dirs: ['WEST', 'NORTH', 'WEST', 'NORTH', 'EAST', 'NORTH']
  },
  { turn: 78, player: 1, id: 7, from: 'H1', budget: 2, dirs: ['NORTH', 'NORTH'] },
  {
    turn: 79,
    player: 2,
    id: 12,
    from: 'F8',
    budget: 6,
    dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'SOUTH', 'EAST', 'SOUTH']
  },
  {
    turn: 80,
    player: 1,
    id: 7,
    from: 'H3',
    budget: 5,
    dirs: ['NORTH', 'WEST', 'NORTH', 'WEST', 'WEST']
  },
  {
    turn: 81,
    player: 2,
    id: 11,
    from: 'I7',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'SOUTH', 'NORTH', 'SOUTH', 'WEST']
  },
  {
    turn: 82,
    player: 1,
    id: 7,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'WEST', 'WEST', 'NORTH']
  },
  { turn: 83, player: 2, id: 11, from: 'H6', budget: 4, dirs: ['WEST', 'WEST', 'NORTH', 'NORTH'] },
  { turn: 84, player: 1, id: 8, from: 'I1', budget: 3, dirs: ['NORTH', 'WEST', 'WEST'] },
  { turn: 85, player: 2, id: 11, from: 'F8', budget: 4, dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'EAST'] },
  {
    turn: 86,
    player: 1,
    id: 8,
    from: 'G2',
    budget: 5,
    dirs: ['WEST', 'NORTH', 'WEST', 'NORTH', 'NORTH']
  },
  { turn: 87, player: 2, id: 11, from: 'G5', budget: 2, dirs: ['NORTH', 'EAST'] },
  {
    turn: 88,
    player: 1,
    id: 8,
    from: 'E5',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'SOUTH', 'WEST', 'WEST']
  },
  {
    turn: 89,
    player: 2,
    id: 11,
    from: 'H6',
    budget: 6,
    dirs: ['EAST', 'WEST', 'WEST', 'WEST', 'NORTH', 'NORTH']
  },
  {
    turn: 90,
    player: 1,
    id: 8,
    from: 'C7',
    budget: 6,
    dirs: ['NORTH', 'EAST', 'SOUTH', 'SOUTH', 'WEST', 'NORTH']
  },
  {
    turn: 91,
    player: 2,
    id: 11,
    from: 'F8',
    budget: 6,
    dirs: ['SOUTH', 'SOUTH', 'EAST', 'SOUTH', 'SOUTH', 'EAST']
  },
  {
    turn: 92,
    player: 1,
    id: 8,
    from: 'C7',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'NORTH', 'EAST', 'SOUTH', 'WEST']
  },
  {
    turn: 93,
    player: 2,
    id: 11,
    from: 'H4',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'EAST', 'NORTH', 'NORTH', 'NORTH']
  },
  {
    turn: 94,
    player: 1,
    id: 8,
    from: 'C7',
    budget: 5,
    dirs: ['SOUTH', 'SOUTH', 'WEST', 'NORTH', 'NORTH']
  },
  {
    turn: 95,
    player: 2,
    id: 12,
    from: 'G3',
    budget: 5,
    dirs: ['WEST', 'NORTH', 'NORTH', 'NORTH', 'NORTH']
  },
  { turn: 96, player: 1, id: 2, from: 'I3', budget: 1, dirs: ['WEST'] },
  {
    turn: 97,
    player: 2,
    id: 12,
    from: 'F7',
    budget: 6,
    dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'SOUTH', 'SOUTH', 'EAST']
  },
  { turn: 98, player: 1, id: 2, from: 'H3', budget: 3, dirs: ['NORTH', 'WEST', 'WEST'] },
  {
    turn: 99,
    player: 2,
    id: 12,
    from: 'G2',
    budget: 5,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'NORTH', 'EAST']
  },
  {
    turn: 100,
    player: 1,
    id: 2,
    from: 'F4',
    budget: 5,
    dirs: ['NORTH', 'NORTH', 'WEST', 'NORTH', 'NORTH']
  },
  {
    turn: 101,
    player: 2,
    id: 15,
    from: 'H5',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'WEST', 'WEST', 'NORTH', 'NORTH']
  },
  {
    turn: 102,
    player: 1,
    id: 2,
    from: 'E8',
    budget: 6,
    dirs: ['NORTH', 'SOUTH', 'SOUTH', 'WEST', 'WEST', 'NORTH']
  },
  {
    turn: 103,
    player: 2,
    id: 15,
    from: 'F7',
    budget: 6,
    dirs: ['SOUTH', 'SOUTH', 'SOUTH', 'EAST', 'EAST', 'SOUTH']
  },
  { turn: 104, player: 1, id: 6, from: 'G1', budget: 1, dirs: ['WEST'] },
  {
    turn: 105,
    player: 2,
    id: 11,
    from: 'I7',
    budget: 5,
    dirs: ['SOUTH', 'NORTH', 'SOUTH', 'SOUTH', 'WEST']
  },
  { turn: 106, player: 1, id: 6, from: 'F1', budget: 3, dirs: ['NORTH', 'NORTH', 'WEST'] },
  {
    turn: 107,
    player: 2,
    id: 11,
    from: 'H5',
    budget: 6,
    dirs: ['SOUTH', 'NORTH', 'WEST', 'WEST', 'NORTH', 'NORTH']
  },
  {
    turn: 108,
    player: 1,
    id: 6,
    from: 'E3',
    budget: 6,
    dirs: ['NORTH', 'NORTH', 'NORTH', 'WEST', 'WEST', 'NORTH']
  }
];

/** Independent asynchronous scripted players. No shared mutable decision cursor.
 * Both read only the immutable observation supplied by the authoritative engine.
 * Their fixture intentionally demonstrates a completed Moon win, not bot skill.
 * @returns {[import('./match-engine.js').PlayerAdapter,import('./match-engine.js').PlayerAdapter]}
 */
export function createDemoPlayers() {
  /** @param {import('./game-logic.js').Player} player */
  function createPlayer(player) {
    return {
      id: 'scripted-demo-' + player,
      name: player === 1 ? 'Moon scripted test player' : 'Ember scripted test player',
      kind: 'scripted-test',
      /** @param {import('./match-engine.js').Observation} observation */
      async chooseAction(observation) {
        const step = SCRIPT[observation.turnNumber - 1];
        if (
          observation.seed !== DEMO_SEED ||
          !step ||
          step.turn !== observation.turnNumber ||
          step.player !== player ||
          observation.player !== player ||
          observation.state.currentPlayer !== player
        ) {
          throw new Error('Scripted demo does not match this seed, turn, or player.');
        }
        const die = observation.state.dice.find((die) => die.id === step.id);
        if (!die || die.cell !== step.from || die.top !== step.budget) {
          throw new Error('Scripted demo board diverged from its verified starting state.');
        }
        return { dieId: step.id, path: [...step.dirs] };
      }
    };
  }
  return [createPlayer(1), createPlayer(2)];
}
