import { Origin, UserSocket } from '@service/authentication';
import SocketEvent from '~/socket/events/SocketEvent';
import * as command from '@service/command';
import * as terminal from '@service/terminal';
import * as ServerManager from '@manager/server';
import { ServerPermission } from '~/authentication/permissions';
import { LogType } from '@service/terminal';

export default class AttachServerEvent extends SocketEvent {
	event: string = 'console:execute';
	type: Origin = 'panel';
	parameters: string[] = ['string'];

	async onEvent(socket: UserSocket, input: string) {
		if (!socket.glass.attached) return;

		// Ensure the user is still authenticated and allowed to execute commands.
		const user = socket.glass.user;
		const server = await ServerManager.getServerById(user, socket.glass.attached);
		if (!server)
			return socket.emit(
				'console:log',
				terminal.format(LogType.FAIL, 'You are not permitted to access this server.')
			);

		if (!server.hasPermission(user.id, ServerPermission.USE_CONSOLE))
			return socket.emit(
				'console:log',
				terminal.format(LogType.FAIL, 'You are not permitted to execute commands.')
			);

		const processed = command.processor(user, input);
		if (processed.cancelled)
			return terminal.format(LogType.FAIL, 'You are not permitted to execute this command.');

		const packet = JSON.stringify({
			user: user.username,
			original: processed.original,
			command: processed.command
		});

		const serverSocket = server.getSocket();
		if (!serverSocket)
			return socket.emit(
				'console:log',
				terminal.format(LogType.FAIL, 'The server is not currently running.')
			);

		serverSocket.timeout(5000).emit('console:execute', packet, (err) => {
			if (err)
				return socket.emit(
					'console:log',
					terminal.format(LogType.FAIL, `Failed to execute command: ${err.message}`)
				);
		});
	}
}
