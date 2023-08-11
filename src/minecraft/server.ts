import { Server, ServerModel, Subuser } from '../data/models/server';
import Permissionable from '../authentication/permissionable';

export const NAME_REGEX = /^[a-z0-9-_. ]{3,20}$/gi;

export const ServerTypes = [
	'SPIGOT',
	'PAPER',
	'FORGE',
	'FABRIC',
	'BUNGEECORD',
	'VELOCITY',
	'PURPUR',
	'UNKNOWN'
] as const;
export type ServerType = (typeof ServerTypes)[number];

export interface MinecraftServer extends Server {
	// getSocket: () => AuthSocket | null;
}

export interface ClientMinecraftServer extends MinecraftServer, Permissionable {
	role: string;
}

export function toClientServer(server: MinecraftServer, user: string): ClientMinecraftServer {
	if (server.owner === user)
		return {
			...server,
			role: 'Owner',
			permissions: (-1n).toString()
		} as ClientMinecraftServer;

	const subuser: Subuser | undefined = server.users.find((s: Subuser) => s._id == user);

	if (!subuser)
		// Well this is awkward, we'll default to member with 0 perms to prevent any abuse
		return {
			...server,
			role: 'Unknown',
			permissions: 0n.toString()
		} as ClientMinecraftServer;

	return {
		...server,
		role: 'Member',
		permissions: subuser.permissions.toString()
	} as ClientMinecraftServer;
}

export async function getServer(token: string): Promise<MinecraftServer | null> {
	return (await ServerModel.findOne({
		token: token
	})) as MinecraftServer | null;
}
