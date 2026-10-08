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

  it('never dead-ends without WebGL: game.js falls back to the Canvas 2D renderer', () => {
    const game = readFileSync(resolve(diceRoot, 'game.js'), 'utf8');
    const html = readFileSync(resolve(diceRoot, 'index.html'), 'utf8');

    expect(game).toContain("import { SoftRenderer } from './soft-renderer.js';");
    expect(game).toContain('new SoftRenderer(');
    expect(() => readFileSync(resolve(diceRoot, 'soft-renderer.js'))).not.toThrow();
    expect(() => readFileSync(resolve(diceRoot, 'soft-shaders.js'))).not.toThrow();
    // the old dead-end: WebGL 2 missing → error card
    expect(game).not.toMatch(/if \(!webgl2Available\(\)\) \{\s*root\.dataset\.boot = 'failed'/);
    expect(html).not.toContain('WebGL 2');
  });

  it('resolves its relative URLs inside /dice-corners/ even when served without a trailing slash', () => {
    const html = readFileSync(resolve(diceRoot, 'index.html'), 'utf8');

    // Vercel serves the page at /dice-corners too, where ./game.js would mean /game.js
    const base = html.indexOf('<base href="/dice-corners/" />');
    expect(base).toBeGreaterThan(-1);
    for (const relative of [
      '<script type="importmap">',
      'src="./game.js"',
      'href="./classic.html"'
    ]) {
      const at = html.indexOf(relative);
      expect(at).toBeGreaterThan(base);
    }
    expect(html.match(/<base /g)).toHaveLength(1);
  });

  it('reports why it failed instead of failing silently', () => {
    const html = readFileSync(resolve(diceRoot, 'index.html'), 'utf8');
    const game = readFileSync(resolve(diceRoot, 'game.js'), 'utf8');

    expect(html).toContain('id="fallback-detail"');
    expect(html).toContain(
      "console.error('Dice Corners: could not load ' + this.src + ' or a module it imports')"
    );
    expect(html).toContain("window.addEventListener('error'");
    expect(game).toContain("console.error('Dice Corners failed to start:', error)");
  });
});
