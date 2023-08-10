import { Authorized, Body, CurrentUser, Get, HttpError, JsonController, Post } from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import { Server, UserServer } from '~/decorators/server';
import * as command from '@service/command';
import * as terminal from '@service/terminal';

type CommandData = {
	command: string;
};

@Authorized()
@JsonController('/server/:server/console')
export class TermController {
	@Get('/')
	async getConsole(@CurrentUser() user: User, @Server() server: UserServer) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('console:history', (err: Error, history) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(terminal.parseLogs(JSON.parse(history).logs));
			});
		});
	}

	@Post('/')
	async sendCommand(@CurrentUser() user: User, @Server() server: UserServer, @Body() data: CommandData) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		const processed = command.processor(user, data.command);
		if (processed.cancelled) return { cancelled: true };

		const packet = JSON.stringify({
			user: user.username,
			original: processed.original,
			command: processed.command
		});

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('console:execute', packet, (err: Error) => {
				if (err) return resolve(new HttpError(500, 'Failed to send command to server.'));
				resolve({});
			});
		});
	}
}
