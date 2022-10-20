import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { ServerPermission } from 'src/authentication/permissions';
import Permissionable from 'src/authentication/permissionable'
import {MinecraftServer} from "../../minecraft/server";

export type HostLocation = 'MINEHUT' | 'OTHER';
export type ServerType = 'SPIGOT' | 'PAPER' | 'FORGE' | 'FABRIC' | 'BUNGEECORD' | 'VELOCITY' | 'UNKNOWN';

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
	public apiOwner: string;

	@prop({ default: undefined })
	public apiID: string;

	@prop({ default: undefined })
	public suspended?: string;

	@prop({ required: true, default: 'MINEHUT' })
	public host: HostLocation;

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

	@prop({ required: true })
	public createdAt: number;

	@prop({ default: undefined })
	public lastOnline: number;

	// Methods
	public hasPermission(user: string, permission: ServerPermission): boolean {
		const permissions = this.getPermissions(user);
		if (permissions == null) return false;
		return permissions == -1 || (permission & permissions) != 0;
	}

	public getPermissions(user: string): number | null {
		if (this.owner == user) return -1;
		return this.users.find((u) => u._id === user)?.permissions ?? null;
	}

	public toJson(): MinecraftServer {
		return JSON.parse(JSON.stringify(this)) as MinecraftServer;
	}
}

export class Subuser implements Permissionable {
	@prop({ required: true })
	public _id: string;

	@prop({ required: true })
	public permissions: number;
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
