// Provides an authentication wrapper for mongoose models.

import { User } from '@clerk/clerk-sdk-node';
import { Server, ServerModel } from '@model/server';
import { DocumentType } from '@typegoose/typegoose';
import { ServerPermission } from '~/authentication/permissions';

// Server scopes for field visibility.
export const ServerScopes = {
	VIEW_TOKEN: ServerPermission.MANAGE_SERVER,
	VIEW_USERS: ServerPermission.MANAGE_SUBUSERS
};

export type ServerScopes = keyof typeof ServerScopes;

/**
 * Gets all servers that the user has access to.
 * @param user The user id to get servers for.
 * @returns A promise of a list of servers.
 */
export const getServers = async (user: string): Promise<Server[]> => {
	return ServerModel.find({
		$or: [{ owner: user }, { users: { $elemMatch: { id: user } } }]
	});
};

/**
 * Get a server by name only if the user has access to it.
 * @param user The clerk user to get servers for.
 * @param name The name of the server to get.
 * @returns A promise of a server, or null if the user does not have access to it.
 */
export const getServerByName = async (user: User, name: string): Promise<Server | null> => {
	return ServerModel.findOne({
		name,
		$or: [{ owner: user.id }, { users: { $elemMatch: { id: user.id } } }]
	});
};

/**
 * Gets a server based on its token, this is not authenticated or based on a user.
 * @param token The token of the server to get.
 * @returns A promise of a server, or null if the server does not exist.
 */
export const getServerByToken = async (token: string): Promise<DocumentType<Server> | null> => {
	return ServerModel.findOne({ token });
};

/**
 * Gets a server based on its id, if the user has access to it or is the owner.
 * @param user The clerk user to get servers for.
 * @param server The id of the server to get.
 * @returns A promise of a server, or null if the user does not have access to it.
 */
export const getServerById = async (
	user: User,
	server: string
): Promise<DocumentType<Server> | null> => {
	const srv = await ServerModel.findOne({
		_id: server,
		$or: [{ owner: user.id }, { users: { $elemMatch: { id: user.id } } }]
	});
	return srv as DocumentType<Server> | null;
};

/**
 * Gets the number of servers that the user owns (this DOESN'T include servers that the user has access to)
 * @param user The clerk user to get servers for.
 * @returns A promise of the number of servers.
 */
export const getServerCount = async (user: User): Promise<number> => {
	return ServerModel.countDocuments({
		owner: user.id
	});
};

/**
 * Gets a scoped server which is a server with fields removed based on the scopes provided.
 * @param server The server to scope.
 * @param scopes The scopes to apply if the user has access to them.
 * @param user The clerk user to scope the server for.
 * @returns A scoped server.
 */
export const scopeServer = (server: Server, scopes: ServerScopes[], user: User) => {
	let details = JSON.parse(JSON.stringify(server.personalize(user)));

	if (!scopes.includes('VIEW_TOKEN')) delete details.token;
	if (!scopes.includes('VIEW_USERS')) delete details.users;

	return details;
};

/**
 * Check if a user has access to a server's scopes.
 * @param server The server to check.
 * @param user The user id to check.
 * @param scopes The server scopes to check.
 * @see ServerScopes
 * @returns True if the user has access to the server's scopes.
 */
export const hasPermission = (
	server: Server,
	user: string,
	scopes: ServerScopes[] = []
): boolean => {
	if (!server.hasAccess(user)) return false;

	for (const scope of scopes) {
		if (!server.hasPermission(user, ServerScopes[scope])) return false;
	}

	return true;
};

/**
 * The server token is a unique identifier for a server, this checks if the token is valid.
 * @param token The server token to check
 * @returns True if the token is valid.
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
	return (await ServerModel.countDocuments({ token })) > 0;
};
