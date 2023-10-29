import { writable } from 'svelte/store';

export type PromptPart = {
	text: string;
	weight: number;
};

export type Prompt = {
	parts: PromptPart[];
};

export type Prompts = Array<Prompt>;

const defaultValue: Prompts = [
	{
		parts: [
			{
				text: 'Test part',
				weight: 5
			}
		]
	}
];

export const prompts = writable<Prompts>(defaultValue);
