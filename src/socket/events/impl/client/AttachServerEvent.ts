import { Origin, UserSocket } from '@service/authentication';
import SocketEvent from '~/socket/events/SocketEvent';
import * as ServerManager from '@manager/server';
import { ServerPermission } from '~/authentication/permissions';

export default class AttachServerEvent extends SocketEvent {
	event: string = 'server:attach';
	type: Origin = 'panel';
	parameters: string[] = ['string'];

	onEvent(socket: UserSocket, server: string) {
		ServerManager.getServers(socket.glass.user.id).then((servers) => {
			const serverObj = servers.find((s) => s._id == server);
			if (!serverObj) return;

			// See if the user has permission to attach to this server.
			if (!serverObj.hasPermission(socket.glass.user.id, ServerPermission.USE_CONSOLE)) return;

			if (socket.glass.attached) socket.leave('server:' + socket.glass.attached);
			socket.glass.attached = serverObj._id;

			socket.join('server:' + serverObj._id);
		});
	}
}
