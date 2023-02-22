import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { DEFAULT_PERMISSIONS, ServerPermission } from '../../authentication/permissions';
import Permissionable from '../../authentication/permissionable';
import { MinecraftServer } from '../../minecraft/server';
import { onlineServers } from '../../socket';
import { User, UserModel } from './user';

export const types = ['SPIGOT', 'PAPER', 'FORGE', 'FABRIC', 'BUNGEECORD', 'VELOCITY', 'UNKNOWN'] as const;
export type ServerType = typeof types[number];

export type ServerState = 'SETUP' | 'ONLINE' | 'OFFLINE' | 'SUSPENDED';

export async function getServerDistribution() {
	let data = {
		type: {
			SPIGOT: 0,
			PAPER: 0,
			FORGE: 0,
			FABRIC: 0,
			BUNGEECORD: 0,
			VELOCITY: 0,
			UNKNOWN: 0
		},
		state: {
			SETUP: 0,
			ONLINE: 0,
			OFFLINE: 0,
			SUSPENDED: 0
		}
	};

	for (const type of types) {
		data.type[type] = await ServerModel.countDocuments({ serverType: type });
	}

	data.state.SETUP = await ServerModel.countDocuments({ setup: true });
	data.state.ONLINE = onlineServers.size;
	data.state.OFFLINE = (await ServerModel.countDocuments({ setup: undefined, suspended: undefined })) - data.state.ONLINE;
	data.state.SUSPENDED = await ServerModel.countDocuments({ suspended: { $ne: undefined } });

	return data;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Server {
	@prop({ _id: true })
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

	@prop({ required: true, default: [] })
	public ftp: FTPDetails[];

	@prop({ required: true, default: 'UNKNOWN' })
	public serverType: ServerType;

	@prop({ required: true, default: '?' })
	public version: string;

	@prop({ required: true })
	public createdAt: number;

	@prop({ default: undefined })
	public lastOnline: number;

	// Methods
	public hasPermission(user: string, permission: bigint): boolean {
		const permissions = this.getPermissions(user);
		if (permissions == null) return false;

		return permissions == (-1n).toString() || !!(permission & BigInt(permissions));
	}

	public getPermissions(user: string): string | null {
		if (this.owner == user) return (-1n).toString();
		return this.users.find((u) => u._id === user)?.permissions?.toString() ?? null;
	}

	public async getSubusers(): Promise<any[]> {
		const users = [...this.users.map((user: Subuser) => user._id), this.owner];
		const data = await UserModel.find({ _id: { $in: users } });
		return data.map((user: User) => {
			return {
				...user.toJson(),
				permissions: this.users.find((u) => u._id == user._id)?.permissions || DEFAULT_PERMISSIONS,
				role: this.owner == user._id ? 'Owner' : 'Member'
			};
		});
	}

	public getState(): ServerState {
		if (this.suspended) return 'SUSPENDED';
		if (this.setup) return 'SETUP';
		if (onlineServers.has(this._id)) return 'ONLINE';
		return 'OFFLINE';
	}

	public toJson(): MinecraftServer {
		return {
			...JSON.parse(JSON.stringify(this)),
			getSocket: () => {
				return onlineServers.has(this._id) ? onlineServers.get(this._id) : null;
			}
		} as MinecraftServer;
	}
}

export class Subuser implements Permissionable {
	@prop({ required: true })
	public _id: string;

	@prop({ required: true })
	public permissions: string;
}

export class FTPDetails {
	@prop({ required: true })
	public identifier: string;

	@prop({ required: true })
	public password: string;

	@prop({ required: true })
	public assignee: string;
}

// Export Models
export const ServerModel = getModelForClass(Server);
