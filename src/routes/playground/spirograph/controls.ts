import { Controls } from '$lib/modules/controls/Controls';
import type { BooleanControl, NumberControl } from '$lib/types/controls';
import { defaultParams } from './spirograph';

enum Groups {
  params = 'Parameters',
  toggles = 'Toggles'
}

const radiusNode: NumberControl = {
  name: 'Radius',
  group: Groups.params,
  order: 1,
  type: 'number',
  placeholder: 'Main Radius',
  min: 5,
  max: 150,
  step: 1,
  defaultValue: defaultParams.radius,
  icon: 'RulerHorizontal',
  key: 'radius'
};

const branchesNode: NumberControl = {
  name: 'Branches',
  placeholder: 'Branches',
  group: Groups.params,
  order: 2,
  type: 'number',
  min: 1,
  max: 12,
  step: 1,
  defaultValue: defaultParams.branches,
  icon: 'ColorWheel',
  key: 'branches'
};

const connectorsNode: BooleanControl = {
  name: 'Branches',
  description: 'Show connections',
  group: Groups.toggles,
  order: 3,
  type: 'boolean',
  defaultValue: true,
  key: 'showConnectors'
};

const circlesNode: BooleanControl = {
  name: 'Circles',
  description: 'Show circles',
  group: Groups.toggles,
  order: 4,
  type: 'boolean',
  defaultValue: true,
  key: 'showCircles'
};

export const controls = new Controls({
  config: {
    groups: [Groups.params, Groups.toggles],
    nodes: {
      radius: radiusNode,
      branches: branchesNode,
      showConnectors: connectorsNode,
      showCircles: circlesNode
    },
    defaults: defaultParams
  }
});
