import { Controls } from '$lib/modules/controls/Controls';
import type { BooleanControl, NumberControl } from '$lib/types/controls';
import { defaultParams } from './daily-1';

const amplitude: NumberControl = {
	name: 'Amplitude',
	order: 1,
	group: 'Circle params',
	key: 'amplitude',
	type: 'number',
	min: 5,
	max: 40,
	step: 1,
	defaultValue: defaultParams.amplitude,
	placeholder: 'amplitude',
	icon: 'BarChart'
};

const radius: NumberControl = {
	name: 'Radius',
	order: 1,
	group: 'Circle params',
	key: 'radius',
	type: 'number',
	min: 50,
	max: 150,
	step: 1,
	defaultValue: defaultParams.radius,
	placeholder: 'radius',
	icon: 'Angle'
};

const wobble: NumberControl = {
	name: 'Wobble',
	order: 1,
	group: 'Circle params',
	key: 'wobble',
	type: 'number',
	min: 0.2,
	max: 3,
	step: 0.1,
	defaultValue: defaultParams.wobble,
	placeholder: 'wobble',
	icon: 'ShadowOuter'
};

const shadeIntense: NumberControl = {
	name: 'Shade intense',
	order: 1,
	group: 'Circle params',
	key: 'shadeIntense',
	type: 'number',
	min: 1,
	max: 3,
	step: 0.1,
	defaultValue: defaultParams.shadeIntense,
	placeholder: 'shadeIntense',
	icon: 'ShadowOuter'
};

export const controls = new Controls({
	config: {
		groups: ['Circle params'],
		nodes: { amplitude, radius, wobble, shadeIntense },
		defaults: defaultParams
	}
});
