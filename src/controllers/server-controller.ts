import { Authorized, CurrentUser, Delete, Get, HttpError, JsonController, Post, QueryParam } from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import { Server, UserServer } from '~/decorators/server';
import { ServerPermission } from '~/authentication/permissions';
import { ServerModel, generateServerId } from '@model/server';
import { NAME_REGEX } from '~/minecraft/server';
import * as ServerManager from '@manager/server';
import { randomBytes } from 'crypto';

@Authorized()
@JsonController('/server/:server')
export class ServerController {
	@Get('/')
	async getServer(@CurrentUser() user: User, @Server() server: UserServer) {
		return {
			...server.getAsUser(user),
			status: server.server.getStatus()
		};
	}

	@Post('/')
	async createServer(@CurrentUser() user: User, @QueryParam('server') server: string) {
		// Enforce server name length
		if (!NAME_REGEX.test(server.toString())) throw new HttpError(400, 'The server name must be A-Z0-9, and between 3 and 20 characters. Spaces, dashes, periods, and underscores are permitted.');

		// Enforce server name uniqueness (case insensitive)
		const existing = await ServerManager.getServerByName(user.id, server);
		if (existing) throw new HttpError(400, 'You already have a server with that name.');

		// Limit server count
		const count = await ServerManager.getServerCount(user.id);
		if (count >= 5) throw new HttpError(400, 'You have reached the maximum number of servers.');

		// Create server
		const serverObject = await ServerModel.create({
			_id: generateServerId(),
			token: randomBytes(32).toString('hex'),
			name: server,
			owner: user.id,
			setup: true,
			createdAt: Math.floor(Date.now() / 1000)
		});

		return serverObject.save();
	}

	@Delete('/')
	async deleteServer(@CurrentUser() user: User, @Server({ permissions: [ServerPermission.MANAGE_SERVER] }) server: UserServer) {
		server.getAsUser(user);

		await ServerModel.findByIdAndDelete(server.server._id);
		return 'OK';
	}

	@Post('/token/reset')
	async resetToken(@CurrentUser() user: User, @Server({ permissions: [ServerPermission.MANAGE_SERVER] }) server: UserServer) {
		// Get the server as the user to handle permissions.
		server.getAsUser(user);

		// Reset token
		await server.server.resetToken();
		return 'OK';
	}
}
