import { AuthSocket } from '../../../../authentication';
import SocketEvent from '../../../SocketEvent';

import { hasPermission, ServerPermission } from '../../../../../authentication/permissions';
import { io } from '../../../../index';
import { ClientMinecraftServer } from 'src/minecraft/server';

export default class CommandHistoryEvent extends SocketEvent {
	override readonly event = 'FETCH_CONSOLE_HISTORY';
	override readonly type = 'PANEL';
	override readonly parameters = ['string', 'ack'];

	override async onEvent(socket: AuthSocket, server: string, acknowledgement) {
		const minecraft: ClientMinecraftServer | null = await this.canAccessServer(socket, server);

		if (!minecraft) return socket.emit('error', 'You are not allowed to access this server!');

		if (!hasPermission(minecraft, ServerPermission.VIEW_CONSOLE)) return socket.emit('error', 'You are not permitted to do this!');

		io.to(minecraft._id)
			.timeout(5000)
			.emit('FETCH_CONSOLE_HISTORY', (err, history) => {
				if (err) return socket.emit('error', `Failed to fetch console history! ${err}`);

				const data = this.safeParse(history);
				if (!data || !data.logs) return socket.emit('error', 'Invalid response provided by plugin!');

				acknowledgement(data.logs);
			});
	}
}
