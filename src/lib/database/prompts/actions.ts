import { goto } from '$app/navigation';
import { promptsDB } from './db';
import type { PromptsDB } from './types';

export const deletePrompt = async (id: PromptsDB['id']) => {
	try {
		if (!id) throw Error('Prompt ID is not defined');

		await promptsDB.prompts.delete(id);
		const prompts = await promptsDB.prompts.toArray();
		const last = prompts.pop();

		goto(`/mj-prompts/${last ? last.id : 0}`);
	} catch (error) {
		console.warn(`DB Error [prompts]: ${error}`);
	}
};
