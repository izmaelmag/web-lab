import { createInitialState, snapshotState } from './game-logic.js';

const $ = (id) => document.getElementById(id);
const board = $('board');
const pipPositions = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9]
};
let record = null;
let frameIndex = 0;
let inspectedId = null;
let playing = false;
let timer = null;
let worker = null;
let activeId = null;
let dbPromise = null;

// IndexedDB keeps complete, per-roll recordings off the small localStorage quota.
function database() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('dice-corners-observatory', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('matches', { keyPath: 'id' });
        request.result.createObjectStore('summaries', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage is blocked by another tab.'));
    });
  return dbPromise;
}
async function readStore(store, id) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(store)
      .objectStore(store)
      [id === undefined ? 'getAll' : 'get'](id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveMatch(value) {
  const db = await database();
  const summaries = await readStore('summaries');
  const id = crypto.randomUUID();
  const summary = { id, seed: value.seed, outcome: value.outcome, savedAt: Date.now() };
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(['matches', 'summaries'], 'readwrite');
    transaction.objectStore('matches').put({ id, record: value });
    transaction.objectStore('summaries').put(summary);
    const old = [...summaries, summary].sort((a, b) => b.savedAt - a.savedAt).slice(5);
    for (const item of old) {
      transaction.objectStore('matches').delete(item.id);
      transaction.objectStore('summaries').delete(item.id);
    }
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  activeId = id;
}
function outcomeText(outcome) {
  if (outcome.type === 'win') return `${outcome.winner === 1 ? 'Moon' : 'Ember'} wins`;
  if (outcome.type === 'cutoff') return 'Turn cap reached · no winner';
  return 'Player failed · match stopped';
}
async function refreshHistory() {
  try {
    const summaries = (await readStore('summaries')).sort((a, b) => b.savedAt - a.savedAt);
    $('history').replaceChildren();
    if (!summaries.length) {
      const p = document.createElement('p');
      p.className = 'note';
      p.textContent = 'No saved matches yet.';
      $('history').append(p);
    }
    for (const item of summaries) {
      const button = document.createElement('button');
      button.className = `history-entry${item.id === activeId ? ' selected' : ''}`;
      button.textContent = `${outcomeText(item.outcome)} · ${item.outcome.turns} ${item.outcome.turns === 1 ? 'turn' : 'turns'}`;
      const small = document.createElement('small');
      small.textContent = `Seed ${item.seed} · ${new Date(item.savedAt).toLocaleString()}`;
      button.append(small);
      button.onclick = async () => {
        if (worker) return;
        try {
          const saved = await readStore('matches', item.id);
          if (!saved) throw new Error('This recording was removed in another tab.');
          activeId = item.id;
          loadRecord(saved.record);
          await refreshHistory();
        } catch (error) {
          setStatus(error.message, true);
        }
      };
      button.disabled = !!worker;
      $('history').append(button);
    }
  } catch {
    $('history').textContent =
      'Device storage unavailable. You can still run, replay and export matches.';
  }
}
function setStatus(message, error = false) {
  $('run-status').textContent = message;
  $('run-status').classList.toggle('error', error);
}
function setRunning(running) {
  $('run').disabled = running;
  $('demo').disabled = running;
  $('cancel').hidden = !running;
  for (const id of ['moon', 'ember', 'seed', 'turn-cap']) $(id).disabled = running;
  for (const button of $('history').querySelectorAll('button')) button.disabled = running;
}
function stopPlayback() {
  playing = false;
  clearTimeout(timer);
  timer = null;
  $('play').textContent = 'Play';
}
function scheduleFrame() {
  clearTimeout(timer);
  if (!playing || !record) return;
  if (frameIndex >= record.frames.length - 1) {
    stopPlayback();
    return;
  }
  timer = setTimeout(
    () => {
      frameIndex++;
      render();
      scheduleFrame();
    },
    420 / Number($('speed').value)
  );
}
function seek(index) {
  stopPlayback();
  frameIndex = Math.max(0, Math.min(record.frames.length - 1, index));
  render();
}
function loadRecord(value) {
  stopPlayback();
  record = value;
  frameIndex = 0;
  inspectedId = null;
  $('moon-name').textContent = value.players[0].name;
  $('ember-name').textContent = value.players[1].name;
  $('seek').max = String(value.frames.length - 1);
  $('seek').disabled = false;
  $('play').disabled = false;
  $('download').disabled = false;
  $('outcome').textContent =
    `${outcomeText(value.outcome)} after ${value.outcome.turns} ${value.outcome.turns === 1 ? 'turn' : 'turns'}. ${value.outcome.reason || ''} Seed: ${value.seed}.`;
  render();
}
function render() {
  const frame = record?.frames[frameIndex];
  const state = frame?.state || snapshotState(createInitialState());
  board.replaceChildren();
  for (let row = 8; row >= 0; row--)
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.className = `cell ${(col + row) % 2 ? 'alt' : ''}${col > 5 && row < 3 ? ' home-moon' : ''}${col < 3 && row > 5 ? ' home-ember' : ''}${col === 4 && row === 4 ? ' center' : ''}`;
      if (state.trail?.some((p) => p.col === col && p.row === row)) cell.classList.add('trail');
      const die = state.dice.find((d) => d.col === col && d.row === row);
      if (die) {
        const button = document.createElement('button');
        button.className = `die ${die.player === 2 ? 'ember' : 'moon'}${state.selected?.id === die.id ? ' active' : ''}${inspectedId === die.id ? ' inspected' : ''}`;
        button.setAttribute(
          'aria-label',
          `${die.player === 1 ? 'Moon' : 'Ember'} die ${die.id + 1}, ${die.cell}, top ${die.top}. Inspect orientation`
        );
        button.setAttribute('aria-pressed', String(inspectedId === die.id));
        for (const position of pipPositions[die.top]) {
          const pip = document.createElement('span');
          pip.className = 'pip';
          pip.style.gridArea = `${Math.ceil(position / 3)} / ${((position - 1) % 3) + 1}`;
          button.append(pip);
        }
        button.onclick = () => {
          inspectedId = die.id;
          render();
        };
        cell.append(button);
      }
      board.append(cell);
    }
  $('moon-score').textContent = `${state.goals[1]} / 9 home`;
  $('ember-score').textContent = `${state.goals[2]} / 9 home`;
  if (frame) {
    const event = frame.event;
    const detail = event.direction ? ` · ${event.direction.toLowerCase()}` : '';
    $('frame-description').textContent =
      event.type === 'terminal'
        ? `After turn ${record.outcome.turns} · ${record.outcome.type}`
        : `Turn ${frame.turnNumber} · ${frame.player === 1 ? 'Moon' : 'Ember'} · ${event.type.replaceAll('-', ' ')}${detail}`;
    $('frame-count').textContent = `${frameIndex + 1} / ${record.frames.length}`;
    $('seek').value = String(frameIndex);
    $('first').disabled = $('previous').disabled = frameIndex === 0;
    $('last').disabled = $('next').disabled = frameIndex === record.frames.length - 1;
  }
  const selected = state.dice.find((d) => d.id === (inspectedId ?? state.selected?.id));
  $('die-net').hidden = !selected;
  if (selected) {
    $('die-description').textContent =
      `${selected.player === 1 ? 'Moon' : 'Ember'} · die ${selected.id + 1} · ${selected.cell}. North points toward row 9.`;
    $('die-net').replaceChildren();
    for (const side of ['north', 'west', 'top', 'east', 'bottom', 'south']) {
      const face = document.createElement('div');
      face.className = `face ${side}`;
      const strong = document.createElement('strong');
      strong.textContent = String(selected.faces[side]);
      const label = document.createElement('small');
      label.textContent = side;
      face.append(strong, label);
      $('die-net').append(face);
    }
    $('quaternion').textContent =
      `Quaternion x/y/z/w: ${['x', 'y', 'z', 'w'].map((k) => selected.quat[k].toFixed(4)).join(' / ')}`;
  } else {
    $('die-description').textContent = 'Tap any die on the board to inspect its six faces.';
    $('quaternion').textContent = '';
  }
}
function startMatch(demo = false) {
  if (worker) return;
  const seed = $('seed').value.trim();
  const maxTurns = Number($('turn-cap').value);
  if (!demo && (!seed || !Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 500)) {
    setStatus('Choose a seed and a whole-number turn cap from 1 to 500.', true);
    return;
  }
  stopPlayback();
  setRunning(true);
  setStatus('Running test players… You can cancel at any time.');
  try {
    worker = new Worker(new URL('./match-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = async ({ data }) => {
      worker?.terminate();
      $('cancel').hidden = true;
      if (data.error) {
        worker = null;
        setRunning(false);
        setStatus(data.error, true);
        return;
      }
      activeId = null;
      loadRecord(data.record);
      setStatus('Match recorded. Press Play or move the timeline to watch.');
      try {
        await saveMatch(data.record);
        await refreshHistory();
      } catch {
        setStatus(
          'Match is ready, but device storage is unavailable or full. Export it to keep a copy.',
          true
        );
      } finally {
        worker = null;
        setRunning(false);
      }
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      setRunning(false);
      setStatus('The match worker could not start. Reload the page and try again.', true);
    };
    worker.postMessage({ demo, seed, maxTurns, styles: [$('moon').value, $('ember').value] });
  } catch {
    worker = null;
    setRunning(false);
    setStatus('This browser could not start a match worker.', true);
  }
}
$('match-form').onsubmit = (event) => {
  event.preventDefault();
  startMatch();
};
$('demo').onclick = () => startMatch(true);
$('cancel').onclick = () => {
  worker?.terminate();
  worker = null;
  setRunning(false);
  setStatus('Match cancelled. No partial result was saved.');
};
$('play').onclick = () => {
  if (playing) {
    stopPlayback();
    return;
  }
  if (frameIndex === record.frames.length - 1) frameIndex = 0;
  playing = true;
  $('play').textContent = 'Pause';
  render();
  scheduleFrame();
};
$('first').onclick = () => seek(0);
$('last').onclick = () => seek(record.frames.length - 1);
$('previous').onclick = () => seek(frameIndex - 1);
$('next').onclick = () => seek(frameIndex + 1);
$('seek').oninput = () => seek(Number($('seek').value));
$('speed').onchange = () => scheduleFrame();
$('download').onclick = () => {
  if (!record) return;
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dice-corners-${String(record.seed)
    .replace(/[^a-z0-9-]/gi, '_')
    .slice(0, 40)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPlayback();
});
window.addEventListener('pagehide', () => {
  stopPlayback();
  if (worker) {
    worker.terminate();
    worker = null;
    setRunning(false);
    setStatus('Match stopped when you left the page. You can start another match.');
  }
});
// Individual labels keep the grid aligned at every viewport width.
for (const [selector, labels] of [
  ['.rank-labels', [9, 8, 7, 6, 5, 4, 3, 2, 1]],
  ['.file-labels', 'ABCDEFGHI'.split('')]
]) {
  const root = document.querySelector(selector);
  root.replaceChildren();
  for (const label of labels) {
    const span = document.createElement('span');
    span.textContent = String(label);
    root.append(span);
  }
}
render();
refreshHistory();
