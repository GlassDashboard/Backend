/**
 * The compiler is dumb and won't understand that TypeID<T> is actually a generic, so this
 * wrapper for whatever reason makes it work.
 */

import { TypeID, typeid } from 'typeid-js';

export class ID<T extends string> {
	// @ts-ignore
	constructor(public readonly id: TypeID<T>) {}

	toString(): string {
		return this.id.toString();
	}

	type(): T {
		return this.id.getType();
	}

	uuid(): string {
		return this.id.toUUID();
	}

	suffix(): string {
		return this.id.getSuffix();
	}

	static fromString<T extends string>(id: string): ID<T> | null {
		try {
			// @ts-ignore
			return new ID(TypeID.fromString(id));
		} catch (e) {
			console.error(e);
			return null;
		}
	}
}

export function createId<T extends string>(name: T): ID<T> {
	// @ts-ignore
	return new ID(typeid(name));
}
