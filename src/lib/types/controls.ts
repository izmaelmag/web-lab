export type ControlType = 'string' | 'range' | 'number' | 'boolean';

export type ControlValue = string | number | boolean;

export interface ControlNode {
	name: string;
	description?: string;
	order: number;
	group?: string;
	disabled?: boolean;
	hidden?: boolean;
	key: string;
	defaultValue: ControlValue;
}

export interface StringControl extends ControlNode {
	type: 'string';
	defaultValue: string;
	placeholder: string;
}

export interface RangeControl extends ControlNode {
	type: 'range';
	min: number;
	max: number;
	step: number;
	defaultValue: number;
	suffix?: string;
}

export interface NumberControl extends ControlNode {
	type: 'number';
	min: number;
	max: number;
	defaultValue: number;
	placeholder: string;
	step: number;
	icon?: string;
}

export interface BooleanControl extends ControlNode {
	type: 'boolean';
	defaultValue: boolean;
}

export type AnyControl = StringControl | RangeControl | NumberControl | BooleanControl;

export type ControlsData = Record<string, ControlValue>;

export type ControlsConfig = {
	groups: string[];
	nodes: Record<string, AnyControl>;
	defaults?: ControlsData;
};
