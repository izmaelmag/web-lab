import type { Meta, StoryObj } from '@storybook/svelte';

import RangeSlider from '../RangeSlider.svelte';

const meta = {
	title: 'Range Slider',
	component: RangeSlider,
	tags: ['autodocs'],
	argTypes: {
		min: {
			control: { type: 'number' }
		},
		max: {
			control: { type: 'number' }
		},
		value: {
			control: { type: 'number' }
		},
		step: {
			control: { type: 'number' }
		}
	}
} satisfies Meta<RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		min: 1,
		max: 100,
		step: 1,
		value: 50,
		onChange: console.log
	}
};
