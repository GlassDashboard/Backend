import { Origin, UserSocket } from '@service/authentication';
import SocketEvent from '~/socket/events/SocketEvent';

export default class AttachServerEvent extends SocketEvent {
	event: string = 'server:detach';
	type: Origin = 'panel';

	onEvent(socket: UserSocket) {
		if (socket.glass.attached) socket.leave('server:' + socket.glass.attached);
	}
}
