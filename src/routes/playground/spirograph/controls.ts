import { Controls } from '$lib/modules/controls/Controls';
import type { NumberControl } from '$lib/types/controls';
import { defaultParams } from './spirograph';

enum Groups {
	params = 'Parameters'
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

export const controls = new Controls({
	config: {
		groups: [Groups.params],
		nodes: {
			radius: radiusNode,
			branches: branchesNode
		},
		defaults: defaultParams
	}
});
