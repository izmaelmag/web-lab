import { goto } from '$app/navigation';
import { promptsDB } from './db';
import type { PromptsDB } from './types';

export const deletePrompt = async (id: PromptsDB['id']) => {
	try {
		if (!id) throw Error('Prompt ID is not defined');

		const prompts = await promptsDB.prompts.toArray();
		const last = prompts.pop();

		await promptsDB.prompts.delete(id);

		goto(`/mj-prompts/${last ? last.id : ''}`);
	} catch (error) {
		console.warn(`DB Error [prompts]: ${error}`);
	}
};
