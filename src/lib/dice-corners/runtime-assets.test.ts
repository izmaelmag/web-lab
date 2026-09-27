import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const diceRoot = resolve(process.cwd(), 'static/dice-corners');

describe('Dice Corners runtime assets', () => {
  it('self-hosts Three.js so browser privacy settings cannot block the game CDN', () => {
    const html = readFileSync(resolve(diceRoot, 'index.html'), 'utf8');

    expect(html).not.toContain('cdn.jsdelivr.net');
    expect(html).toContain('"three": "./vendor/three/three.module.min.js"');
    expect(html).toContain('"three/addons/": "./vendor/three/addons/"');
    expect(() => readFileSync(resolve(diceRoot, 'vendor/three/three.module.min.js'))).not.toThrow();
    expect(() => readFileSync(resolve(diceRoot, 'vendor/three/three.core.min.js'))).not.toThrow();
    expect(() =>
      readFileSync(resolve(diceRoot, 'vendor/three/addons/controls/OrbitControls.js'))
    ).not.toThrow();
  });
});
