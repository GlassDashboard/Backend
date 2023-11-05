import {
	Authorized,
	CurrentUser,
	Delete,
	Get,
	HttpError,
	JsonController,
	Post,
	QueryParam
} from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import { Server, UserServer } from '~/decorators/server';
import { ServerPermission } from '~/authentication/permissions';
import { ServerModel, generateServerId } from '@model/server';
import { NAME_REGEX } from '~/minecraft/server';
import * as ServerManager from '@manager/server';
import { randomBytes } from 'crypto';

@Authorized()
@JsonController('/server/:server/user')
export class UserController {
	@Get('/all')
	async getServer(@CurrentUser() user: User, @Server() server: UserServer) {
		server.getAsUser(user);
		const users = await server.server.getUsers();

		// Limit the information provided to prevent leaking sensitive information.
		return users.map((sub) => {
			return {
				id: sub.user.id,
				permissions: sub.permissions,
				username: sub.user.username,
				avatar: sub.user.imageUrl,
				owner: sub.owner
			};
		});
	}

	@Post('/')
	async createServer(@CurrentUser() user: User, @QueryParam('server') server: string) {
		// Enforce server name length
		if (!NAME_REGEX.test(server.toString()))
			throw new HttpError(
				400,
				'The server name must be A-Z0-9, and between 3 and 20 characters. Spaces, dashes, periods, and underscores are permitted.'
			);

		// Enforce server name uniqueness (case insensitive)
		const existing = await ServerManager.getServerByName(user, server);
		if (existing) throw new HttpError(400, 'You already have a server with that name.');

		// Limit server count
		const count = await ServerManager.getServerCount(user);
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
	async deleteServer(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.MANAGE_SERVER] })
		server: UserServer
	) {
		server.getAsUser(user);

		await ServerModel.findByIdAndDelete(server.server._id);
		return 'OK';
	}

	@Post('/token/reset')
	async resetToken(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.MANAGE_SERVER] })
		server: UserServer
	) {
		// Get the server as the user to handle permissions.
		server.getAsUser(user);

		// Reset token
		await server.server.resetToken();
		return 'OK';
	}
}
