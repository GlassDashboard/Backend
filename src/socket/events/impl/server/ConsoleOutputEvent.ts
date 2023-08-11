import { Origin, ServerSocket } from '@service/authentication';
import SocketEvent from '~/socket/events/SocketEvent';
import { io } from '~/socket';
import * as terminal from '@service/terminal';

export default class AttachServerEvent extends SocketEvent {
	event: string = 'console:log';
	type: Origin = 'server';
	parameters: string[] = ['string'];

	onEvent(socket: ServerSocket, log: string) {
		const json = this.safeParse(log);
		if (!json) return;

		const logged = terminal.parseLog(json);
		io.to('server:' + socket.glass.server._id).emit('console:log', logged);
	}
}
