import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { DEFAULT_PERMISSIONS } from '../../authentication/permissions';
import Permissionable from '../../authentication/permissionable';
import { randomBytes } from 'crypto';
import { AuthenticatedSocket } from '@service/authentication';
import * as socket from '~/socket';
import clerkClient, { User } from '@clerk/clerk-sdk-node';
import { createId, ID } from '~/wrapper/typeid';

export const types = [
	'SPIGOT',
	'PAPER',
	'FORGE',
	'FABRIC',
	'BUNGEECORD',
	'VELOCITY',
	'UNKNOWN'
] as const;
export type ServerType = typeof types[number];
export type ServerState = 'SETUP' | 'ONLINE' | 'OFFLINE' | 'SUSPENDED';

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Server {
	@prop({
		_id: true,
		type: String
		// @ts-ignore
		// get: (id) => TypeID.fromString(id).asType('srv'),
		// set: (id) => id.toString()
	})
	// @ts-ignore
	public _id: string;

	@prop({ required: true })
	public token: string;

	@prop({ required: true })
	public name: string;

	@prop({ required: true })
	public owner: string;

	@prop({ default: undefined })
	public suspended?: string;

	@prop({ required: true, default: [] })
	public users: Subuser[];

	@prop({ default: undefined })
	public network?: string[];

	@prop({ default: undefined })
	public setup?: boolean;

	@prop({ required: true, default: 'UNKNOWN' })
	public serverType: ServerType;

	@prop({ required: true, default: '?' })
	public version: string;

	@prop({ required: true })
	public createdAt: number;

	@prop({ default: undefined })
	public lastOnline: number;

	// Methods
	public getSocket(): AuthenticatedSocket | null {
		return socket.getSocketOrNull(this._id.toString());
	}

	public personalize(user: User): PersonalizedServer {
		let role: string = 'Guest';
		if (this.owner == user.id) role = 'Owner';
		else if (this.users.some((u) => u._id == user.id)) role = 'Member';

		return {
			...JSON.parse(JSON.stringify(this)),
			role,
			permissions: this.getPermissions(user.id) || DEFAULT_PERMISSIONS
		};
	}

	public getStatus(): ServerState {
		if (this.suspended) return 'SUSPENDED';
		if (this.setup) return 'SETUP';
		if (this.getSocket()) return 'ONLINE';
		return 'OFFLINE';
	}

	public hasAccess(user: string): boolean {
		return this.owner == user || this.users.some((u) => u._id == user);
	}

	public getPermissions(user: string): bigint | null {
		if (this.owner == user) return -1n;

		const permissions = this.users.find((u) => u._id === user)?.permissions;
		if (!permissions) return null;

		return BigInt(permissions) || DEFAULT_PERMISSIONS;
	}

	public hasPermission(user: string, permission: bigint): boolean {
		const permissions = this.getPermissions(user);
		if (!permissions) return false;

		return permissions == -1n || !!(permissions & permission);
	}

	public async addUser(user: User, permissions: bigint = DEFAULT_PERMISSIONS) {
		const document = this as unknown as DocumentType<Server>;
		document.users.push({
			_id: generateSubuserId().toString(),
			user: user.id,
			permissions: permissions.toString()
		});

		await document.save();
	}

	public async resetToken(): Promise<void> {
		const document = this as unknown as DocumentType<Server>;
		this.token = randomBytes(32).toString('hex');
		await document.save();
	}

	public getOwnerAsSubuser(): Subuser {
		return {
			_id: generateSubuserId().toString(),
			user: this.owner,
			permissions: '-1'
		};
	}

	public async getUsers(): Promise<ClerkSubuser[]> {
		return Promise.all(
			this.users.concat([this.getOwnerAsSubuser()]).map(async (subuser) => {
				const user = await clerkClient.users.getUser(subuser.user);
				return {
					id: subuser._id,
					permissions: BigInt(subuser.permissions) || DEFAULT_PERMISSIONS,
					user,
					owner: subuser.user == this.owner
				};
			})
		);
	}
}

class Subuser implements Permissionable {
	@prop({ required: true })
	public _id: string;

	@prop({ required: true })
	public user: string;

	@prop({ required: true })
	public permissions: string;
}

export interface PersonalizedServer extends Server {
	role: string;
	permissions: bigint;
}

// Export Models
export const ServerModel = getModelForClass(Server);

// Export Interfaces
export interface ClerkSubuser {
	id: string;
	permissions: bigint;
	user: User;
	owner: boolean;
}

// Export ID Generators
// @ts-ignore
export const generateServerId = (): ID<'srv'> => {
	return createId('srv');
};

// @ts-ignore
export const generateSubuserId = (): ID<'sub'> => {
	return createId('sub');
};
