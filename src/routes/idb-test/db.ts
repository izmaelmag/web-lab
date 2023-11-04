import Dexie, { type Table } from 'dexie';

export interface User {
	id?: number;
	name: string;
	surname: string;
	age: number;
}

export class TypedDexie extends Dexie {
	users!: Table<User>;

	constructor() {
		super('testDatabase');

		this.version(1).stores({
			users: '++id, name, surname, age'
		});
	}
}

export const db = new TypedDexie();