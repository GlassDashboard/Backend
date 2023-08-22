import { Origin, UserSocket } from '@service/authentication';
import SocketEvent from '~/socket/events/SocketEvent';
import * as ServerManager from '@manager/server';
import { ServerPermission } from '~/authentication/permissions';

export default class AttachServerEvent extends SocketEvent {
	event: string = 'file:metadata';
	type: Origin = 'panel';
	parameters: string[] = ['string', 'ack'];

	async onEvent(socket: UserSocket, path: string, ack: (value: any) => void) {
		if (!socket.glass.attached) return;

		// Ensure the user is still authenticated and allowed to fetch file data
		const user = socket.glass.user;
		const server = await ServerManager.getServerById(user, socket.glass.attached);
		if (!server) return socket.emit('error', 'You are not permitted to access this server.');

		if (!server.hasPermission(user.id, ServerPermission.READ_FILES))
			return socket.emit('error', 'You are not permitted to do this.');

		const serverSocket = server.getSocket();
		if (!serverSocket) return socket.emit('error', 'The server is not currently online.');

		const resolvedPath = {
			path,
			root: false
		};

		serverSocket.timeout(5000).emit('file:metadata', resolvedPath, (err: Error, metadata) => {
			if (err) return socket.emit('error', err.message);
			ack(this.safeParse(metadata));
		});
	}
}
