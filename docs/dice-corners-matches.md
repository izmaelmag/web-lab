# Dice Corners local matches and replay

This prototype runs local agents against the existing Dice Corners rules and records their decisions for replay. It does not connect to an AI service: no API keys, provider requests, paid calls, or model-generated strategic claims are involved.

## Rules remain unchanged

The match engine imports `static/dice-corners/game-logic.js`, the same deterministic rules used by the playable game and classic-parity tests. A turn selects one movable die and spends its starting top-face value as orthogonal rolls. Every intermediate cell must be in bounds and unoccupied. The centre bonus applies only when a completed turn ends on the centre. A win requires all nine dice in the opposing home.

Backtracking, revisiting cells, and remaining in or returning to a home corner are deliberately legal. The runner must not invent anti-stalling or anti-camping rules. Match limits are operational cutoffs, not game-rule wins.

## Browser usage

Open `/dice-corners/replay.html` from the local development server. Choose the two labeled test bots, a seed, and a turn limit (UI: 1–500), then run the match. Generation runs in a module worker. Cancel terminates that worker without saving a partial recording.

The viewer supports play/pause, stepping, scrubbing, and inspecting recorded turns and die orientations. Replaying a finished record reads its frames and never calls an adapter. The latest five completed records are kept in this browser's IndexedDB; export JSON for a portable copy. Clearing browser storage removes those local records. JSON import is not included in this prototype; the headless validation API can validate a saved JSON record.

## Headless usage

From the repository root, run this with Node (ES modules):

```js
import { createTestPlayer, runMatch, validateRecord } from './static/dice-corners/match-engine.js';

const record = await runMatch({
  seed: 'my-repeatable-match',
  maxTurns: 120,
  players: [createTestPlayer('goal-seeking'), createTestPlayer('wander')]
});

console.log(record.outcome);
console.log(validateRecord(record)); // { valid: true, errors: [] }
const json = JSON.stringify(record); // portable recording, no timestamp randomness
```

`seed` accepts a string or finite number. `maxTurns` is an integer from 1 through 10,000. The default policies are explicitly local test bots, not AI models. Goal-seeking scores complete legal paths; wander samples legal rolls. Neither promises strong play or eventual victory. A cutoff is an expected result, particularly when dice block each other's home corners.

The same seed, policies, rules version, and bound reproduce the built-in policies' entire record. Opening-roll and decision streams are separate. Custom adapters are responsible for their own reproducibility; saved actions can still be replayed without calling their adapters.

## Completed-game fixture

`static/dice-corners/demo-match.js` exports `DEMO_SEED` and `createDemoPlayers()`. Running those players with that seed and `maxTurns: 120` reproduces a full 108-turn Moon victory from the standard setup, including centre bonuses. This deliberately cooperative scripted fixture demonstrates an actual completed replay; it is not a claim about competitive strength or a model-generated match.

## Adapter contract

An adapter has `id`, `name`, and `kind` strings and an asynchronous `chooseAction(observation)` function. An observation contains:

- `state`: detached, deeply frozen snapshot, including every die's complete quaternion and six oriented faces
- `player`, `turnNumber`, and the match `seed`
- `decisionSeed`: a stable per-player, per-turn seed for a local decision

Return exactly `{ dieId, path }`, where `path` is an ordered array of `NORTH`, `SOUTH`, `EAST`, or `WEST`. Coordinates are zero-based columns and rows; north increases the row. The path must spend the selected die's full starting top-face budget. Endpoint-only moves and additional action fields are rejected. The engine validates against a disposable copy, then commits each roll through the existing rules. Adapter exceptions and invalid actions stop the match with `adapter-failure`; they do not award the other player a win. A player with no legal die automatically forfeits its turn under the existing rules.

Adapters never receive live mutable game state. Snapshots and the finished record are deeply frozen. `stateFromSnapshot(snapshot)` creates a detached rules state for analysis; mutating it cannot alter the recording.

## Recording schema (version 1)

The JSON record contains:

- `schemaVersion`, `rulesVersion`, `baseCommit`: recording format and rules provenance
- `seed`, `maxTurns`, `players`: configuration and adapter identity metadata
- `openingRolls`: every Moon/Ember d6 pair, including ties
- `initialState`: the canonical pregame state
- `actions`: successful `{ turnNumber, player, action: { dieId, path } }` entries
- `frames`: sequential `{ index, state, event, turnNumber, player, actionIndex? }` entries
- `outcome`: `{ type, winner, reason, turns, player? }`

Frames cover initial setup, opening rolls, start, die selection, each physical roll, turn end, handover, automatic forfeits, and terminal status. Snapshots retain positions, quaternions, six face values, selection, remaining budget, path, redo state, turn, phase, and goal counts. Roll events include from/to cells and quaternions, allowing replay without inferring orientation from the top face.

Outcome types are `win`, `cutoff`, or `adapter-failure`. Only `win` has a non-null `winner`. Failure includes the affected player; `turns` counts completed turns. A cutoff does not change the board phase to `WIN` or redefine the rules.

`validateRecord(record)` reconstructs the opening from the seed and applies each recorded action to fresh authoritative rules state. It compares every frame, including complete orientations, and checks the outcome. It returns `{ valid, errors }`; it does not execute adapters. This detects accidental or deliberate disagreement with the rules, but is not a cryptographic signature, proof of adapter identity, or authentication of failure-reason text. Treat names and reasons as untrusted text when displaying imported data. The provenance marker identifies the source rules baseline; it is not a release hash for the whole application.

## Future provider and budget boundaries

No provider implementation, credential handling, network call, token accounting, or paid request is enabled. A future model integration must remain behind the adapter boundary and return the same proposed path for authoritative validation. Provider selection, credentials, cancellation/timeouts, request/token caps, per-match spending limits, and explicit user approval for paid calls require a separate implementation. The current `maxTurns` bound limits completed game turns; it is not a monetary budget. An adapter that does not settle within 30 seconds fails the match. This timeout cannot preempt synchronously blocking JavaScript; terminating the browser worker is the UI cancellation boundary.

Do not put API keys in replay JSON, browser assets, or adapter metadata. A replay needs recorded actions and state, not provider secrets. Adding paid providers is outside this prototype.

## Tests

```sh
npm run test:unit -- --run src/lib/dice-corners/match-engine.test.ts
npm run test:unit -- --run src/lib/dice-corners
```

The focused suite covers seeded reproducibility, authoritative replay and tampering, quaternion/face preservation, illegal paths, detached/frozen adapter data, adapter errors, and cutoff semantics. A canonical 108-turn scripted game verifies real engine victory, centre bonuses, and complete replay; a near-win fixture also verifies the legal ninth-die move; separate existing classic-parity suites continue to exercise the unchanged game rules. Intentional backtracking and own-home camping have explicit regression coverage.
