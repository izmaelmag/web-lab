import { Controls } from '$lib/modules/controls/Controls';
import type { NumberControl } from '$lib/types/controls';
import { defaultParams } from './daily-2';

const gridSize: NumberControl = {
  name: 'Grid size',
  order: 1,
  group: 'Options',
  key: 'gridSize',
  type: 'number',
  min: 10,
  max: 100,
  step: 2,
  defaultValue: defaultParams.gridSize,
  placeholder: 'gridSize',
  icon: 'Frame'
};

const noiseScale: NumberControl = {
  name: 'Noise scale',
  order: 2,
  group: 'Options',
  key: 'noiseScale',
  type: 'number',
  min: 0.01,
  max: 1,
  step: 0.01,
  defaultValue: defaultParams.noiseScale,
  placeholder: 'noiseScale',
  icon: 'Padding'
};

const fade: NumberControl = {
  name: 'Fade',
  order: 3,
  group: 'Options',
  key: 'fade',
  type: 'number',
  min: 0,
  max: 50,
  step: 1,
  defaultValue: defaultParams.fade,
  placeholder: 'fade',
  icon: 'Shadow'
};

const speed: NumberControl = {
  name: 'Speed',
  order: 4,
  group: 'Options',
  key: 'speed',
  type: 'number',
  min: 1,
  max: 4,
  step: 1,
  defaultValue: defaultParams.speed,
  placeholder: 'speed',
  icon: 'Stopwatch'
};

const darkness: NumberControl = {
  name: 'Darkness',
  order: 5,
  group: 'Options',
  key: 'darkness',
  type: 'number',
  min: -8,
  max: 8,
  step: 1,
  defaultValue: defaultParams.darkness,
  placeholder: 'darkness',
  icon: 'BlendingMode'
};

export const controls = new Controls({
  config: {
    groups: ['Options'],
    nodes: { gridSize, noiseScale, fade, speed, darkness },
    defaults: defaultParams
  }
});
