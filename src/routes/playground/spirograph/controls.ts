import type { AnyControl, ControlsConfig, NumberControl } from '$lib/types/controls';
import { defaultParams } from './spirograph';

type ParamsKey = keyof typeof defaultParams;

const radiusNode: NumberControl = {
	name: 'Radius',
	group: 'main',
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
	group: 'main',
	order: 2,
	type: 'number',
	min: 1,
	max: 6,
	step: 1,
	defaultValue: defaultParams.branches,
	icon: 'ColorWheel',
	key: 'branches'
};

const nodes: Record<ParamsKey, AnyControl> = {
	radius: radiusNode,
	branches: branchesNode
};

export const controlsConfig: ControlsConfig = {
	groups: ['main'],
	nodes,
	defaults: defaultParams
};
