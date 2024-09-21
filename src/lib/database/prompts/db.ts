import Dexie, { type Table } from 'dexie';
import { type PromptsDB, PromptsDBName, type PromptPart } from './types';

export class TypedDexie extends Dexie {
  ['prompts']!: Table<PromptsDB>;
  ['parts']!: Table<PromptPart>;

  constructor() {
    super(PromptsDBName);

    this.version(2).stores({
      prompts: '++id, name, settings',
      parts: '++id, promptId, name, weight'
    });
  }
}

export const promptsDB = new TypedDexie();
