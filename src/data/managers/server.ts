// Provides an authentication wrapper for mongoose models.

import { User } from '@clerk/clerk-sdk-node';
import { Server, ServerModel } from '@model/server';
import { ServerPermission } from '~/authentication/permissions';

// Server scopes for field visibility.
export const ServerScopes = {
	VIEW_TOKEN: ServerPermission.MANAGE_SERVER,
	VIEW_USERS: ServerPermission.MANAGE_SUBUSERS
};

export type ServerScopes = keyof typeof ServerScopes;

export const getServers = async (user: string): Promise<Server[]> => {
	return ServerModel.find({
		$or: [{ owner: user }, { users: { $elemMatch: { id: user } } }]
	});
};

export const getServerByName = async (user: string, name: string): Promise<Server | null> => {
	return ServerModel.findOne({
		name,
		$or: [{ owner: user }, { users: { $elemMatch: { id: user } } }]
	});
};

export const getServerByToken = async (token: string): Promise<Server | null> => {
	return ServerModel.findOne({ token });
};

export const getServer = async (user: string, server: string): Promise<Server | null> => {
	const srv = await ServerModel.findOne({
		id: server,
		$or: [{ owner: user }, { users: { $elemMatch: { id: user } } }]
	});
	console.log(srv);
	return srv;
};

export const getServerCount = async (user: string): Promise<number> => {
	return ServerModel.countDocuments({
		$or: [{ owner: user }, { users: { $elemMatch: { id: user } } }]
	});
};

export const scopeServer = (server: Server, scopes: ServerScopes[], user: User) => {
	let details = JSON.parse(JSON.stringify(server.personalize(user)));

	if (!scopes.includes('VIEW_TOKEN')) delete details.token;
	if (!scopes.includes('VIEW_USERS')) delete details.users;

	return details;
};

export const hasPermission = (server: Server, user: string, scopes: ServerScopes[] = []): boolean => {
	if (!server.hasAccess(user)) return false;

	for (const scope of scopes) {
		if (!server.hasPermission(user, ServerScopes[scope])) return false;
	}

	return true;
};

export const isTokenValid = async (token: string): Promise<boolean> => {
	return (await ServerModel.countDocuments({ token })) > 0;
};
