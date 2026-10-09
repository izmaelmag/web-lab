import { createTestPlayer, runMatch } from './match-engine.js';
import { createDemoPlayers, DEMO_SEED } from './demo-match.js';

self.onmessage = async ({ data }) => {
  try {
    const record = await runMatch({
      seed: data.demo ? DEMO_SEED : data.seed,
      maxTurns: data.demo ? 120 : data.maxTurns,
      players: data.demo ? createDemoPlayers() : data.styles.map((style) => createTestPlayer(style))
    });
    self.postMessage({ record });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Match failed.' });
  }
};
