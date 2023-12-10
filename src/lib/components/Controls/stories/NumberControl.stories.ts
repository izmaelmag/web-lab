import type { Meta, StoryObj } from '@storybook/svelte';

import NumberControl from '../NumberControl.svelte';
import type { NumberControl as NCType } from '$lib/types/controls';

const testControl: NCType = {
	name: 'Radius',
	group: 'main',
	order: 1,
	type: 'number',
	placeholder: 'Test value',
	min: 1,
	max: 100,
	step: 1,
	defaultValue: 50,
	icon: 'RulerHorizontal',
	key: 'radius'
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
	title: 'Number Control',
	component: NumberControl,
	tags: ['autodocs'],
	argTypes: {
		control: {
			control: { type: 'object' }
		}
	}
} satisfies Meta<NumberControl>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
	args: {
		control: testControl,
		onChange: (patch: Record<string, number>) => {
			console.log(patch);
		}
	}
};
