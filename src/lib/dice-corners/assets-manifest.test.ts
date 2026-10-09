import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd(), 'assets/dice-corners');

interface TextureEntry {
  file: string;
  width: number;
  height: number;
  godot: { filter: boolean; repeat: string; srgb: boolean };
}

interface AudioEntry {
  file: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationSeconds: number;
  seed: number;
  godot: { loop: boolean; normalize: boolean; loopBegin: null; loopEnd: null };
}

interface Manifest {
  version: string;
  textures: TextureEntry[];
  audio: AudioEntry[];
}

function pngSize(buf: Buffer) {
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  expect(buf.toString('ascii', 12, 16)).toBe('IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function wavInfo(buf: Buffer) {
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
  expect(buf.toString('ascii', 12, 16)).toBe('fmt ');
  expect(buf.readUInt16LE(20)).toBe(1);
  const channels = buf.readUInt16LE(22);
  const rate = buf.readUInt32LE(24);
  const bits = buf.readUInt16LE(34);
  expect(buf.toString('ascii', 36, 40)).toBe('data');
  const dataBytes = buf.readUInt32LE(40);
  expect(buf.length).toBe(44 + dataBytes);
  return { channels, rate, bits, dataBytes };
}

describe('Dice Corners exported assets', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8')) as Manifest;

  it('lists the baked textures and cues', () => {
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.textures).toHaveLength(29);
    expect(manifest.audio).toHaveLength(39);
    expect(new Set(manifest.textures.map((entry) => entry.file)).size).toBe(29);
    expect(new Set(manifest.audio.map((entry) => entry.file)).size).toBe(39);
  });

  it('matches each PNG to its declared size and nearest-clamp import hint', () => {
    for (const entry of manifest.textures) {
      const buf = readFileSync(resolve(root, entry.file));
      expect(pngSize(buf)).toEqual({ width: entry.width, height: entry.height });
      expect(entry.godot.filter).toBe(false);
      expect(entry.godot.repeat).toBe('clamp');
      expect(entry.godot.srgb).toBe(true);
    }
  });

  it('matches each WAV to 48 kHz stereo 16-bit PCM with loop and normalise off', () => {
    for (const entry of manifest.audio) {
      const info = wavInfo(readFileSync(resolve(root, entry.file)));
      expect(info).toMatchObject({
        channels: entry.channels,
        rate: entry.sampleRate,
        bits: entry.bitDepth
      });
      expect(entry.sampleRate).toBe(48000);
      expect(entry.channels).toBe(2);
      expect(entry.bitDepth).toBe(16);
      expect(entry.godot.loop).toBe(false);
      expect(entry.godot.normalize).toBe(false);
      expect(entry.godot.loopBegin).toBeNull();
      expect(entry.godot.loopEnd).toBeNull();
      const frames = info.dataBytes / (entry.channels * 2);
      expect(Math.abs(entry.durationSeconds - frames / entry.sampleRate)).toBeLessThan(1e-6);
      expect(entry.seed).toBeGreaterThanOrEqual(0xd1ce);
    }
  });

  it('vendors the OFL faces used by the HUD', () => {
    for (const file of [
      'fonts/jacquard-24/Jacquard24-Regular.ttf',
      'fonts/jacquard-24/OFL.txt',
      'fonts/pixelify-sans/PixelifySans-wght.ttf',
      'fonts/pixelify-sans/OFL.txt',
      'fonts/silkscreen/Silkscreen-Regular.ttf',
      'fonts/silkscreen/Silkscreen-Bold.ttf',
      'fonts/silkscreen/OFL.txt'
    ]) {
      expect(existsSync(resolve(root, file))).toBe(true);
    }
  });
});
