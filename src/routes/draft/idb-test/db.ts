import Dexie, { type EntityTable } from 'dexie';

export interface User {
  id?: number;
  name: string;
  surname: string;
  age: number;
}

export class TypedDexie extends Dexie {
  users!: EntityTable<User, 'id'>;

  constructor() {
    super('testDatabase');

    this.version(1).stores({
      users: '++id, name, surname, age'
    });
  }
}

export const db = new TypedDexie();
