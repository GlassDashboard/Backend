import { User } from '@clerk/clerk-sdk-node';
import { ServerModel, Server as ServerObject } from '@model/server';
import { Request } from 'express';
import { createParamDecorator } from 'routing-controllers';
import { ServerScopes } from '@manager/server';
import * as ServerManager from '@manager/server';
import { InsufficientPermissionsError, MissingScopesError, ServerNotFoundError } from '~/errors/servers';
import { ServerPermission, getPermissionName } from '~/authentication/permissions';

/**
 * Represents a user with access to a server.
 */
export interface UserServer {
	/**
	 * The server, this is always available regardless of user.
	 */
	server: ServerObject;

	/**
	 * Whether the user has access to the server. This does not check permissions specific to this route.
	 * @param user The user to check.
	 * @returns Whether the user has access.
	 */
	hasAccess(user: User): boolean;

	/**
	 * Gets the server if the user has access, along with scopes applied.
	 * @param user The user to check.
	 * @throws ServerNotFoundError Thrown if the user does not have access to the server, or if the server does not exist.
	 * @throws MissingScopesError Thrown if the user does not have the required scopes.
	 * @returns A cleaned server object with scopes applied.
	 */
	getAsUser(user: User): ServerObject | null;
}

type ServerDecoratorOptions = {
	/**
	 * Whether the server is required.
	 */
	required?: boolean;

	/**
	 * Any permissions required to perform the action on the route.
	 * @see ServerPermission
	 */
	permissions?: bigint[];
};

export function Server(options?: ServerDecoratorOptions) {
	return createParamDecorator({
		required: options && options.required,
		value: async (action) => {
			// Get the server name from the request.
			const req = action.request as Request;
			const name = req.params['server'];
			if (!name) throw new ServerNotFoundError();

			// Get the server object
			const server: ServerObject | null = await ServerModel.findById(name);
			if (!server) throw new ServerNotFoundError();

			// Check what scopes are wanted
			let scopes: ServerScopes[] = [];

			const scopeQuery = req.query['scopes'];
			if (scopeQuery && typeof scopeQuery == 'string') {
				// Parse it as a list of scopes.
				let data: string[] = scopeQuery.split(',');
				for (const scope of data) {
					if (scope in ServerScopes) scopes.push(scope as ServerScopes);
				}
			}

			return {
				server,

				hasAccess: (user: User) => {
					return ServerManager.hasPermission(server, user.id, scopes);
				},

				getAsUser: async (user: User) => {
					if (!server.hasAccess(user.id)) throw new ServerNotFoundError();
					if (!ServerManager.hasPermission(server, user.id, scopes)) throw new MissingScopesError(scopes);

					// Check if the user has route permissions if required.
					if (options && options.permissions) {
						for (const permission of options.permissions) {
							if (!server.hasPermission(user.id, permission)) throw new InsufficientPermissionsError(getPermissionName(permission));
						}
					}

					return ServerManager.scopeServer(server, scopes);
				}
			};
		}
	});
}
