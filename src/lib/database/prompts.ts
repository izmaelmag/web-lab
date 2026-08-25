import Dexie, { type EntityTable } from 'dexie';

export interface Prompt {
  id?: number;
  settings: {
    ar: string;
  };
}

export interface PromptPart {
  id?: number;
  promptId: Prompt['id'];
  text: string;
  weight: number;
}

export class PromptsDB extends Dexie {
  prompts!: EntityTable<Prompt, 'id'>;
  parts!: EntityTable<PromptPart, 'id'>;

  constructor() {
    super('prompts');

    this.version(1).stores({
      prompts: '++id',
      parts: '++id, promptId'
    });
  }
}

export const promptsDB = new PromptsDB();
