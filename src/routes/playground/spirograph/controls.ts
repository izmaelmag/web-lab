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

const nodes: Record<ParamsKey, AnyControl> = {
	radius: radiusNode
};

export const controlsConfig: ControlsConfig = {
	groups: ['main'],
	nodes,
	defaults: defaultParams
};
