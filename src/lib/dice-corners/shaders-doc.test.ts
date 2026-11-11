import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const game = readFileSync(resolve(root, 'static/dice-corners/game.js'), 'utf8');
const doc = readFileSync(resolve(root, 'docs/dice-corners/SHADERS.md'), 'utf8');

function authorGlsl(name: string) {
  const marker = `const ${name} = /* glsl */ \``;
  const start = game.indexOf(marker);
  expect(start, name).toBeGreaterThan(-1);
  const bodyStart = start + marker.length;
  const end = game.indexOf('`;', bodyStart);
  expect(end, name).toBeGreaterThan(bodyStart);
  return game.slice(bodyStart, end).trim();
}

describe('Dice Corners shader capture', () => {
  it('quotes the six author shaders from game.js', () => {
    for (const name of [
      'OVERLAY_VERTEX',
      'OVERLAY_FRAGMENT',
      'SKY_VERTEX',
      'SKY_FRAGMENT',
      'SPARK_VERTEX',
      'SPARK_FRAGMENT'
    ]) {
      const body = authorGlsl(name);
      expect(body.length).toBeGreaterThan(40);
      expect(doc).toContain(body);
    }
  });
});
