import type { Component } from 'svelte';
import OrbitGeometry from './OrbitGeometry.svelte';
import RainbowRain from './RainbowRain.svelte';
import Triangled from './Triangled.svelte';
import TrippyGeometry from './TrippyGeometry.svelte';
import WavingRainbowText from './WavingRainbowText.svelte';

export type Piece = Component<{ preview?: boolean; playing?: boolean }>;

export const pieces: Record<string, Piece> = {
  'rainbow-rain': RainbowRain,
  'orbit-geometry': OrbitGeometry,
  'trippy-geometry': TrippyGeometry,
  triangled: Triangled,
  'waving-rainbow-text': WavingRainbowText
};
