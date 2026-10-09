# Rules

Pure rules live in `static/dice-corners/game-logic.js`. They do not touch the DOM or the GPU. A port’s rules module should be equally pure and should satisfy every vector in this file. Quaternions are `{ x, y, z, w }` in the same component order and the same operation order as three.js `Quaternion`.

Players are `1` (Moon; classic “White”) and `2` (Ember; classic “Black”). There is no third player.

## Board

- `BOARD_SIZE = 9`. Columns `0..8` are files A–I. Rows `0..8` are ranks 1–9. Row 0 is rank 1.
- Cell key is the string `"col,row"` (no spaces). Label is `char(65 + col) + (row + 1)`.
- In bounds: `0 ≤ col < 9` and `0 ≤ row < 9`.
- Centre relic: `{ col: 4, row: 4 }`, label `E5`.
- World position of a cell centre, in board units: `x = col`, `z = 8 - row`, `y = 0` on the floor. Die centres rest at `y = 0.425` (`DIE_SIZE / 2`, `DIE_SIZE = 0.85`, `CELL_SIZE = 1`).
- Inverse: `col = round(x)`, `row = 8 - round(z)`, or null when that cell is off the board.

| Cell | Label | World `(x, z)` |
| ---- | ----- | -------------- |
| 0,0  | A1    | 0, 8           |
| 8,8  | I9    | 8, 0           |
| 4,4  | E5    | 4, 4           |

`worldToCell(0, 8) = {0,0}`. `worldToCell(4.49, 3.51) = {4,4}`. `worldToCell(8.4, -0.4) = {8,8}`. `worldToCell(-0.51, 4) = null`. `worldToCell(4, 8.51) = null`.

### Directions

Discovery order, and the order used to break shortest-path ties, is **NORTH, SOUTH, EAST, WEST**. Do not sort the other way.

| Name  | `dc` | `dr` | World travel `(x, y, z)` | Opposite |
| ----- | ---- | ---- | ------------------------ | -------- |
| NORTH | 0    | +1   | `(0, 0, -1)`             | SOUTH    |
| SOUTH | 0    | −1   | `(0, 0, +1)`             | NORTH    |
| EAST  | +1   | 0    | `(+1, 0, 0)`             | WEST     |
| WEST  | −1   | 0    | `(−1, 0, 0)`             | EAST     |

NORTH increases the row index and decreases world `z`. From Moon’s starting camera (looking toward −Z), NORTH is away from the camera, into the board.

### Homes and goals

A home is the 3×3 corner a guild starts in. A guild wins by filling the **other** home.

| Guild | Home (inclusive)           | Goal                                     |
| ----- | -------------------------- | ---------------------------------------- |
| Moon  | cols 6–8, rows 0–2 (G1–I3) | Ember’s home, cols 0–2, rows 6–8 (A7–C9) |
| Ember | cols 0–2, rows 6–8         | Moon’s home, cols 6–8, rows 0–2          |

`isGoalCell(1, 0, 8)` is true. `isGoalCell(1, 8, 0)` is false. `isGoalCell(2, 8, 0)` is true. At the opening, `countInGoal` is 0 for both and `checkWin` is false for both.

`checkWin(state, player)` is true only when every die with `die.player === player` stands on a goal cell of that player. Opponent dice are ignored. The check runs for the guild who just finished a turn, and for nobody else.

## Dice

Eighteen dice, ids `0..17`. Moon is created first (ids 0–8), then Ember (ids 9–17), in the row order below. `spawnValue` is the top face at creation. The live top face is always read from the quaternion; it is not a stored counter.

### Starting layout `[col, row, top]`

Moon:

| id  | cell | top | id  | cell | top | id  | cell | top |
| --- | ---- | --- | --- | ---- | --- | --- | ---- | --- |
| 0   | G3   | 1   | 3   | G2   | 1   | 6   | G1   | 1   |
| 1   | H3   | 1   | 4   | H2   | 2   | 7   | H1   | 2   |
| 2   | I3   | 1   | 5   | I2   | 2   | 8   | I1   | 3   |

Ember:

| id  | cell | top | id  | cell | top | id  | cell | top |
| --- | ---- | --- | --- | ---- | --- | --- | ---- | --- |
| 9   | A7   | 1   | 12  | A8   | 2   | 15  | A9   | 3   |
| 10  | B7   | 1   | 13  | B8   | 2   | 16  | B9   | 2   |
| 11  | C7   | 1   | 14  | C8   | 1   | 17  | C9   | 1   |

At the start, eight dice are boxed in (no free orthogonal neighbour): Moon `H1 I1 H2 I2` (ids 7, 8, 4, 5) and Ember `A8 B8 A9 B9` (ids 12, 13, 15, 16). Both guilds still have a legal die, so nobody forfeits on turn 1. `dieAt(E5)` is null. `occupiedKeys` has 18 entries. Leaving id 8 out removes `I1` only.

### Faces

Western dice: opposites sum to 7, and 1-2-3 meet counter-clockwise at a corner. Local normals in die space, at rest (identity quaternion, top face 1):

| Value | Local normal | Resting direction          |
| ----- | ------------ | -------------------------- |
| 1     | `(0, +1, 0)` | top                        |
| 6     | `(0, −1, 0)` | bottom                     |
| 2     | `(0, 0, +1)` | south / toward Moon’s edge |
| 5     | `(0, 0, −1)` | north                      |
| 3     | `(+1, 0, 0)` | east                       |
| 4     | `(−1, 0, 0)` | west                       |

Box-material / atlas slot order `[+X, −X, +Y, −Y, +Z, −Z]` is `FACE_ORDER = [3, 4, 1, 6, 2, 5]`.

Pip centres on a 4×4 grid, coordinates `(gx, gy)` with `gx, gy ∈ {1, 2, 3}`. The painter places a pip at pixel `(gx * 8, gy * 8)` on a 32×32 face.

| Value | Pips `(gx, gy)`                       |
| ----- | ------------------------------------- |
| 1     | `(2,2)`                               |
| 2     | `(1,1) (3,3)`                         |
| 3     | `(1,1) (2,2) (3,3)`                   |
| 4     | `(1,1) (1,3) (3,1) (3,3)`             |
| 5     | `(1,1) (1,3) (2,2) (3,1) (3,3)`       |
| 6     | `(1,1) (1,2) (1,3) (3,1) (3,2) (3,3)` |

`faceValueToward(q, worldDirection)` rotates each local normal by `q` and returns the value whose rotated normal has the greatest dot with `worldDirection`. Ties keep the earlier value in the order 1, 2, 3, 4, 5, 6. `topFaceValue(q)` is `faceValueToward(q, (0,1,0))`.

### Quaternions

```
identity = { x: 0, y: 0, z: 0, w: 1 }

multiply(a, b) = {          // Hamilton product, a then b, three.js multiplyQuaternions
  x: a.x*b.w + a.w*b.x + a.y*b.z - a.z*b.y
  y: a.y*b.w + a.w*b.y + a.z*b.x - a.x*b.z
  z: a.z*b.w + a.w*b.z + a.x*b.y - a.y*b.x
  w: a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z
}

fromAxisAngle(axis, angle) = {
  x: axis.x * sin(angle/2)
  y: axis.y * sin(angle/2)
  z: axis.z * sin(angle/2)
  w: cos(angle/2)
}

normalize(q): divide by length; if length is 0, return identity.

rotateVector(v, q): three.js Vector3.applyQuaternion (q is unit).
  tx = 2 * (q.y*v.z - q.z*v.y)
  ty = 2 * (q.z*v.x - q.x*v.z)
  tz = 2 * (q.x*v.y - q.y*v.x)
  return (
    v.x + q.w*tx + q.y*tz - q.z*ty,
    v.y + q.w*ty + q.z*tx - q.x*tz,
    v.z + q.w*tz + q.x*ty - q.y*tx
  )

rollAxis(direction) = normalize(cross((0,1,0), direction.world))
  NORTH → (−1, 0, 0)
  SOUTH → (+1, 0, 0)
  EAST  → (0, 0, −1)
  WEST  → (0, 0, +1)

rollQuat(q, direction) = normalize(fromAxisAngle(rollAxis(direction), +π/2) * q)
```

The angle is always **+90°**. Direction lives in the axis, never in the sign of the angle. A +90° turn about that axis tips the top face toward the direction of travel. `rollQuat` returns a new quaternion and does not mutate its input.

`sameRotation(a, b)` is true when `|dot(a, b)| ≥ 1 − 1e-9` (`q` and `−q` match).

### One roll from rest

Components below are the exact `sin(π/4) = cos(π/4)` values from the formulas (`≈ 0.707106781187`). Top face after one roll from identity:

| Roll  | Quaternion `(x, y, z, w)`                 | Top |
| ----- | ----------------------------------------- | --- |
| none  | `(0, 0, 0, 1)`                            | 1   |
| NORTH | `(−0.707106781187, 0, 0, 0.707106781187)` | 2   |
| WEST  | `(0, 0, 0.707106781187, 0.707106781187)`  | 3   |
| EAST  | `(0, 0, −0.707106781187, 0.707106781187)` | 4   |
| SOUTH | `(0.707106781187, 0, 0, 0.707106781187)`  | 5   |

Two NORTHs from identity show 6: quaternion `(−1, 0, 0, 0)`.

Worked sequence from identity. Faces are listed as up / down / east / west / south / north:

| After | Faces       | Quaternion `(x, y, z, w)` rounded to 6 dp |
| ----- | ----------- | ----------------------------------------- |
| NORTH | 2/5/3/4/6/1 | `(−0.707107, 0, 0, 0.707107)`             |
| NORTH | 6/1/3/4/5/2 | `(−1, 0, 0, 0)`                           |
| EAST  | 4/3/6/1/5/2 | `(−0.707107, 0.707107, 0, 0)`             |
| SOUTH | 2/5/6/1/4/3 | `(−0.5, 0.5, 0.5, 0.5)`                   |
| WEST  | 6/1/5/2/4/3 | `(−0.707107, 0, 0.707107, 0)`             |
| WEST  | 5/2/1/6/4/3 | `(−0.5, −0.5, 0.5, −0.5)`                 |

Invariants the tests lock:

- Four rolls in the same direction restore the same rotation (`sameRotation`).
- `rollQuat(rollQuat(q, d), opposite(d))` restores `q` and the same top face.
- Rolling reaches exactly the 24 orientations of the cube, and no more.
- In every orientation the six face values are `{1,2,3,4,5,6}` and the three opposite pairs each sum to 7.
- After 10 000 random rolls the quaternion is still unit length (12 decimal places) and still one of those 24 rotations. The test’s PRNG is mulberry32 with seed `2024` (see [Seeded PRNG](#seeded-prng)).

### Starting orientation

`initialQuat(top, player)` starts at identity and applies only `rollQuat`:

| Top | Rolls from identity |
| --- | ------------------- |
| 1   | none                |
| 2   | NORTH               |
| 3   | WEST                |
| 4   | EAST                |
| 5   | SOUTH               |
| 6   | NORTH, NORTH        |

If `player === 2`, then premultiply a 180° rotation about world up: `normalize(fromAxisAngle((0,1,0), π) * q)`. That turns the die toward Ember’s own near edge and does not change the top face. For every top value, the face Moon shows toward world +Z equals the face Ember shows toward world −Z.

Moon (`player 1`) results:

| Top | `(x, y, z, w)`                            |
| --- | ----------------------------------------- |
| 1   | `(0, 0, 0, 1)`                            |
| 2   | `(−0.707106781187, 0, 0, 0.707106781187)` |
| 3   | `(0, 0, 0.707106781187, 0.707106781187)`  |
| 4   | `(0, 0, −0.707106781187, 0.707106781187)` |
| 5   | `(0.707106781187, 0, 0, 0.707106781187)`  |
| 6   | `(−1, 0, 0, 0)`                           |

Ember (`player 2`):

| Top | `(x, y, z, w)`                            |
| --- | ----------------------------------------- |
| 1   | `(0, 1, 0, 0)`                            |
| 2   | `(0, 0.707106781187, 0.707106781187, 0)`  |
| 3   | `(0.707106781187, 0.707106781187, 0, 0)`  |
| 4   | `(−0.707106781187, 0.707106781187, 0, 0)` |
| 5   | `(0, 0.707106781187, −0.707106781187, 0)` |
| 6   | `(0, 0, 1, 0)`                            |

Signed zeroes (`-0`) may appear and compare equal under `componentDelta` / `sameRotation`. Match within `1e-12` on each component against `initialQuat`, which itself matches classic `initialQuat` within `1e-12`.

### The roll arc (presentation, but the pose is normative)

One step does not hop. The die pivots about its leading bottom edge while the gap between `DIE_SIZE` (0.85) and `CELL_SIZE` (1) glides in linearly so the die finishes dead-centre on the next cell. `t` goes from 0 to 1 linearly (no easing on the roll itself).

```
half = 0.425
(dx, _, dz) = direction.world
pivot = (start.x + dx * half, start.z + dz * half)
partial = fromAxisAngle(rollAxis(direction), (π/2) * t)
offset = rotateVector((start.x - pivot.x, start.y, start.z - pivot.z), partial)
glide = 0.15 * t
position = (offset.x + pivot.x + dx * glide,
            offset.y,
            offset.z + pivot.z + dz * glide)
quat = normalize(partial * startQuat)
```

Worked arc, identity die, centre `(4, 0.425, 4)`, direction NORTH:

| t   | Position                   | Rotation                                  |
| --- | -------------------------- | ----------------------------------------- |
| 0   | `(4, 0.425, 4)`            | identity                                  |
| 0.5 | `(4, 0.601040764009, 3.5)` | `(−0.382683432365, 0, 0, 0.923879532511)` |
| 1   | `(4, 0.425, 3)`            | `rollQuat(identity, NORTH)`               |

`0.601040764009 = 0.425 * √2`. At `t = 1` the logical cell has already been committed by `applyStep`; the mesh is then snapped to the resting pose (`restDie`), which matches this endpoint.

## Reachability

`getReachableCells(start, steps, occupied)` is a breadth-first search.

- `occupied` is a set of `"col,row"` keys. The moving die’s own cell is **not** in the set (the caller passes occupancy with that id excluded).
- The origin is recorded at distance 0 and then **removed** from the result. It is not a legal target.
- From each frontier cell, if `dist < steps`, try NORTH, SOUTH, EAST, WEST in that order.
- Skip a neighbour that is off the board, already discovered, or occupied.
- First discovery wins, so the parent chain is a shortest path and the direction order breaks ties.
- `steps ≤ 0` yields an empty map (the origin is inserted and then deleted).

From `(4,4)` with 2 steps and nothing occupied: 12 cells, every one at Manhattan distance equal to its `dist`, and `(4,4)` absent.

From `(0,0)` with 2 steps and nothing occupied, the keys are exactly `0,1`, `0,2`, `1,0`, `1,1`, `2,0`.

A wall of occupied cells on row 5, start `(4,4)`, 6 steps: every reached row is `< 5`.

One blocker on `(4,5)`, start `(4,4)`: `(4,6)` is reached in **4** steps, and is not reached in 3.

`reconstructPath(reachable, start, targetKey)` walks `prev` links back to the origin, reverses them, and turns each hop into a direction. Unknown targets and the origin key return `[]`.

Worked path: start `(4,4)`, 4 steps, blocker `(4,5)`, target `(4,6)`:

```
EAST, NORTH, NORTH, WEST
```

`(4,3)` from the same map is just `SOUTH`.

The same BFS, including parent pointers and map insertion order, matches `classic.html` on 600 random boards (mulberry32 seed 5; 0–29 extra blockers; 1–6 steps).

## Opening roll

```
rollD6(random) = 1 + floor(random() * 6)     // random in [0, 1)
decideFirstPlayer(moon, ember) = null if equal, else the higher roll’s player
rollForFirstPlayer(random):
  repeat
    pair = [rollD6(random), rollD6(random)]
  until the pair is not a tie
  return { rolls: every pair including ties, firstPlayer }
```

There is no tie cap. A hundred ties followed by a decisive pair still returns all 101 pairs plus the winner.

Vector: `random` yields `0.5, 0.5, 0.99, 0`. Rolls are `[[4,4], [6,1]]`. Moon moves first. `0.5 → 4` because `floor(0.5 * 6) + 1 = 4`. `0.99 → 6`. `0 → 1`.

`decideFirstPlayer(5, 3) = 1`. `decideFirstPlayer(2, 6) = 2`. `decideFirstPlayer(4, 4) = null`.

## State

```
phase: PREGAME | PLAYER_TURN | DIE_SELECTED | DIE_MOVING | TRANSITION | WIN
currentPlayer: 1 | 2
turnNumber: integer, starts at 1
dice: Die[]
selectedId: number | null
stepBudget: integer          // top face at the moment of selection; frozen for the turn
stepsRemaining: integer
origin: { col, row } | null  // cell where the die was picked
path: { dir, fromCol, fromRow }[]
redoStack: Direction[]       // most recent undo at the end
winner: 1 | 2 | null
```

`createInitialState()`:

- phase `PREGAME`, `currentPlayer` 1 (nominal; the opening roll overwrites this), `turnNumber` 1
- the 18 dice in `initialQuat(spawnValue, player)`
- selection fields empty, `winner` null

Two fresh states are deep-equal and do not share dice objects.

`startGame(state, firstPlayer)` succeeds only in `PREGAME` with `firstPlayer` of 1 or 2. It sets `currentPlayer`, `turnNumber = 1`, phase `PLAYER_TURN`. A second call returns false and changes nothing.

### Who may be picked

`canSelectDie` requires all of:

- phase is `PLAYER_TURN` or `DIE_SELECTED`
- the die exists, belongs to `currentPlayer`, and is not stuck
- `path.length === 0` (the current pick has not rolled yet)

`selectDie` then sets `selectedId`, phase `DIE_SELECTED`, `stepBudget = stepsRemaining = topFaceValue(quat)`, `origin` to the die’s cell, and clears `path` and `redoStack`.

`deselectDie` succeeds only in `DIE_SELECTED` with an empty path. It returns to `PLAYER_TURN` and clears the selection fields.

`clickDie` is what a board click means:

| Situation                                        | Result       |
| ------------------------------------------------ | ------------ |
| Missing die, or phase is not a picking phase     | `ignored`    |
| Click the selected die, and deselect succeeds    | `deselected` |
| Click the selected die after it has rolled       | `locked`     |
| Opponent’s die                                   | `ignored`    |
| Own die, but the current pick has already rolled | `locked`     |
| Own die that is stuck                            | `stuck`      |
| Own free die, before any roll this pick          | `selected`   |

Selecting another of your dice before the first roll switches the pick and recaptures that die’s top face as the budget. The budget is the orientation, not `spawnValue`. Forcing the die at G3 (id 0) to `initialQuat(5, 1)` and selecting it yields budget 5.

At the opening, after `startGame(..., 1)`: selecting id 0 (G3) yields budget 1, origin `{6,2}`. Selecting Ember’s C7 fails. Selecting Moon’s H2 (stuck) fails. Selecting id 99 fails. Phase stays `PLAYER_TURN`.

### Moving

`selectionReach` is `getReachableCells` from the selected die across `stepsRemaining`, with that die excluded from occupancy. Empty if nobody is selected or no steps remain.

`planMove(col, row)` returns the direction list, or `[]` when the phase is not `DIE_SELECTED` or the cell is unreachable.

`beginMove(col, row)` returns that list, clears `redoStack`, and sets phase `DIE_MOVING`. It returns null when the list is empty.

`applyStep(direction)` commits **one** roll. It requires phase `DIE_MOVING`, a selected die, `stepsRemaining > 0`, and a destination that is in bounds and not occupied by someone else. It pushes `{ dir, fromCol, fromRow }` using the cell **before** the roll, decrements `stepsRemaining`, then moves and `rollQuat`s the die. The returned step is:

```
{ dieId, direction, from, to, fromQuat, toQuat, stepsRemaining }
```

`stepsRemaining` on the result is the value **after** the decrement.

`finishMove`:

- not in `DIE_MOVING` → null
- steps still left → phase `DIE_SELECTED`, result `'continue'`
- steps spent → result `'turn-complete'` and the phase stays `DIE_MOVING` so `completeTurn` can run

The page’s click-to-move is: `beginMove`, then `applyStep` + animate for each direction, then `finishMove`.

You cannot end a turn early. There is no pass. “Stop partway” means you may click a nearer cell, land in `DIE_SELECTED` with steps left, and click onward. The budget captured at selection does not change when the top face changes mid-turn.

### Worked turn

Moon to move. Force the die at G3 (id 0) to top 3, which is `initialQuat(3, 1) = (0, 0, 0.707106781187, 0.707106781187)`.

Reachable with budget 2 from G3, board otherwise at the start: keys `4,2`, `5,1`, `5,2`, `5,3`, `6,3`, `6,4`, `7,3`.

Move that same die (budget forced to 3) to G6 `(6,5)`:

- rolls: `NORTH, NORTH, NORTH`
- path: `{NORTH from 6,2}`, `{NORTH from 6,3}`, `{NORTH from 6,4}`
- step results report `stepsRemaining` 2, then 1, then 0
- first step: from `{6,2}` to `{6,3}`
- die ends at `{6,5}`; G3 is empty
- `finishMove` is `'turn-complete'`
- tops along the way: start 3, after one NORTH **2**, after two **4**, after three **5**
- quaternion after the third NORTH, 6 dp: `(−0.5, 0.5, −0.5, −0.5)`

Stop after the first cell only (`moveTo (6,3)`): `finishMove` is `'continue'`, phase `DIE_SELECTED`, `stepsRemaining` 2, `stepBudget` still 3, top face is no longer 3. From there, `(6,2)` is reachable (distance 1) and `(6,5)` is reachable in 2. A second move to `(6,5)` completes the turn and the path has length 3.

Refusals from G3 with budget 2: `(6,5)` is too far, `(7,2)` is occupied (id 1), `(6,2)` is the origin. `beginMove` before a selection returns null. `applyStep` before `beginMove` returns null. After `beginMove(6,3)`, `applyStep(EAST)` returns null because H3 is occupied, and the path stays empty.

Once `path.length > 0`, clicking the selected die or another of your dice returns `locked`, and `deselectDie` returns false.

### Undo and redo

`canUndo`: phase `DIE_SELECTED`, a die is selected, `path` is non-empty.

`undoStep` pops the path, refunds one step, pushes that direction onto `redoStack`, and rolls the die with `OPPOSITE[dir]` (a real reverse tip, not a stored quaternion). Phase stays `DIE_SELECTED`.

`canRedo`: phase `DIE_SELECTED`, a die is selected, `redoStack` is non-empty.

`redoStep` pops the redo stack, sets phase `DIE_MOVING`, and `applyStep`s that direction. The caller must `finishMove`, same as any other roll. If `applyStep` fails, the direction is pushed back and the phase returns to `DIE_SELECTED`.

`beginMove` clears the redo stack. So does `selectDie`, including a switch to another die.

Worked undo: budget 3 from G3, move to G5 `(6,4)` (two NORTHs), then undo once.

- reverse step direction `SOUTH`, from `{6,4}` to `{6,3}`, `stepsRemaining` 2
- orientation matches `rollQuat(initialQuat(3, 1), NORTH)`
- path is only `{NORTH from 6,2}`
- redo stack is `['NORTH']`
- G5 is empty

Undoing both rolls of a two-step move back to G3 restores the original quaternion, top 3, budget 3, empty path, redo length 2. Clicking H3 (id 1) then succeeds and clears the redo stack.

Redo of that double undo: first redo is NORTH from `{6,2}` to `{6,3}` with `stepsRemaining` 2, and `finishMove` is `'continue'`. Redo stack still has one `NORTH`. Second redo lands on `{6,4}` with 1 step left and an empty redo stack.

Undo/redo return null when nothing is selected, when the matching stack is empty, and while phase is `DIE_MOVING` (a roll is in progress). After the budget hits zero and the turn completes, the phase is no longer `DIE_SELECTED`, so the exhausting roll cannot be undone.

### End of turn

`completeTurn` requires phase `DIE_MOVING`, a selected die, and `stepsRemaining === 0`. Otherwise null.

If the die is on E5, the centre bonus replaces its quaternion with `initialQuat(6, player)` (canonical 6, Ember still yawed 180°). The result’s `bonus` is `{ dieId, fromQuat, toQuat }` with `fromQuat` captured before the replacement. Crossing E5, or pausing there with steps still left, does **not** grant the bonus. The bonus does not add steps and does not grant another turn.

Then the selection is cleared (`selectedId`, budget, steps, origin, path, redo). If `checkWin` for the mover, `winner` is that player and phase is `WIN`. Otherwise phase is `TRANSITION`. `currentPlayer` does not change inside `completeTurn`.

`advanceTurn` succeeds in `TRANSITION`, or in `PLAYER_TURN` when `playerHasMove` is false (a forfeit). It flips `currentPlayer`, increments `turnNumber`, sets phase `PLAYER_TURN`, and returns:

```
{ player, turnNumber, mustForfeit: !playerHasMove(state) }
```

`mustForfeit` refers to the guild that just received the turn. The page calls `advanceTurn` again while that flag is set. If both guilds are sealed, this does not terminate (open question 1 in DESIGN.md).

`resetGame` assigns a fresh `createInitialState()` onto the same object.

### Worked endings

- Ember to move, one step from C7 to D7, `completeTurn`, `advanceTurn` → `{ player: 1, turnNumber: 2, mustForfeit: false }`. A further `advanceTurn` is null.
- Moon, budget 4, from G3 to E5: `completeTurn` sets that die to `initialQuat(6, 1)` and top face 6. The same for Ember from C7, using `initialQuat(6, 2)`.
- Moon, budget 5, visit E5 and leave to E6: `bonus` is null and the quaternion is untouched.
- Moon, budget 1, G3 → G4: `completeTurn` is `{ bonus: null, winner: null }`, phase `TRANSITION`, selection cleared, `currentPlayer` still 1.
- `completeTurn` with steps left, or with no selection, is null.

Win vector. Place Moon’s nine dice on A7, B7, A8, B8, C8, A9, B9, C9, and D7 (id 8). Place Ember anywhere off those cells (the test uses rows 2–3, cols 3–7). `startGame` as Moon, force id 8 to top 1, move D7 → C7. `completeTurn` sets `winner: 1`, phase `WIN`. `advanceTurn` is null. Further selection fails.

Not-a-win vector. Ember’s nine dice already fill G1–I3, but it is Moon’s turn and Moon’s ninth die is not entering Moon’s goal. Moon moves the die at E2 (id 8, top forced to 1) to E1. `winner` stays null and phase is `TRANSITION`. Only the mover is checked.

Forfeit vector. Pack Ember on A7–C9 and seal them with Moon dice on A6, B6, C6, D8, D9, D6, plus three leftover Moon dice on I1, I2, H1. Moon’s id 5 (the die placed on D6) has top 1 and steps to D7. `advanceTurn` after that turn returns `{ player: 2, turnNumber: 2, mustForfeit: true }`. Ember cannot be picked (`stuck`). The next `advanceTurn` returns `{ player: 1, turnNumber: 3, mustForfeit: false }`.

`isSelectionBlocked` is true when a die is selected, steps remain, and `selectionReach` is empty. The HUD then says to undo. Example: Moon, G3, budget 2, and cells G4 and F3 occupied.

`trailCells` is the origin of each path entry plus the die’s current cell. Empty when nothing is selected. After the budget-3 move from G3 that stopped on G5: `(6,2), (6,3), (6,4)`. One undo drops the last cell.

`snapshotState` is a detached, JSON-safe view: phase, players, budget, path copy, redo copy, selected die `{ id, player, col, row, top, cell }`, all dice in that shape, reachable `{ col, row, dist }`, trail, goal counts, `canUndo`, `canRedo`, `blocked`. Mutating the snapshot does not mutate the game. After the one-step continue from G3 with budget 3, the snapshot’s selected cell is `G4`, `stepsRemaining` is 2, `canUndo` is true, `canRedo` is false, and reachable contains `{ col: 6, row: 5, dist: 2 }`.

## Seeded PRNG

Tests and the asset export share mulberry32:

```
seeded(seed):
  a = seed as uint32
  each call:
    a = (a + 0x6d2b79f5) as uint32
    t = a
    t = imul(t xor (t >>> 15), t or 1)
    t = t xor (t + imul(t xor (t >>> 7), t or 61))
    return ((t xor (t >>> 14)) as uint32) / 4294967296
```

`pick(items, random)` is `items[floor(random() * items.length)]`.

## Self-play

The shipped game has **no AI**. `src/lib/dice-corners/self-play.test.ts` is a stress harness. It plays 30 games, seeds `1000 + gameIndex`, at most 120 turns or until `WIN`. Both seats use the same policy:

```
opening = rollForFirstPlayer(random); startGame
each turn:
  if the side to move has no legal die: advanceTurn and continue
  pick a uniform random die among canSelectDie
  loop up to 50 times:
    r = random()
    if r < 0.15 and canUndo: undoStep and continue
    else if r < 0.30 and canRedo: redoStep
    else: pick a uniform random reachable cell, beginMove, applyStep each roll
    finishMove; break on 'turn-complete'
  completeTurn
  if bonus: orientation is initialQuat(6, player) and top is 6
  if winner: stop
  else advanceTurn
```

Invariants on every visit: 18 distinct in-bounds cells; `path.length + stepsRemaining === stepBudget` while a die is selected; every orientation matches classic `rollDie` within `1e-9`; reachable maps match classic including order; the chosen path matches classic `reconstructPath`. Across the 30 games the harness must record more than 2000 rolls, 50 undos, 20 redos, and at least one centre bonus. A port that wants this stress test can run the same policy against its rules module. Do not ship the policy as a computer opponent unless asked.

## Classic versus current

`classic.html` is still linked from the menu (“Prefer the original? Play the classic table.”). `src/lib/dice-corners/classic-oracle.ts` evaluates the classic rule functions and the tests require the current module to match them: directions, opposites, face normals, pip layout, face order, spawn layout, zones, `rollDie`, `topFaceValue`, `initialQuat`, BFS parent chains, `reconstructPath`, `isStuck`, `playerHasMove`, `checkWin`.

So the **rules** of the live game and the classic table are the same, including:

- 9×9, the same 18 dice, the same homes
- step budget = top face at selection
- orthogonal steps, no entering or crossing occupied cells
- shortest path with NORTH-SOUTH-EAST-WEST tie breaks
- undo is the opposite physical roll; redo replays it
- centre tile sets the die to canonical 6 at end of turn only
- win is all nine of the mover’s dice in the far corner
- higher opening d6 moves first; ties reroll
- a side with no legal die forfeits

What the classic page does **not** define, and the current page does, is the midnight presentation: names Moon and Ember, pixel art, toon shading, sigils, relic gem, orbit-to-fit camera, software-renderer fallback, and the HUD in STATE-AND-INPUT.md. Classic calls the guilds White and Black, uses flat colours (`P1` body `#F5F0E8` / pips `#1A1A1A`, `P2` body `#2A2A2A` / pips `#F5F0E8`, tiles `#cdb79a` and `#8a7657`, highlight `#4A9EFF` and `#FF6B4A`), and a fixed camera (`height 10.5`, `distance 8.6`, zoom 7–22). Classic’s roll duration `0.26` s and bonus lift `1.25` match the current full-motion timings. Classic’s camera transition is `0.8` s; the current flip is `0.9` s. Follow the current timings for a port of the live game.

`DIE_CHAMFER` and `SPRING` in the classic config are unused. See open question 4.
