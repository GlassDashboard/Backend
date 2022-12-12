import { AuthSocket } from '../../../../authentication';
import SocketEvent from '../../../SocketEvent';

import { hasPermission, ServerPermission } from '../../../../../authentication/permissions';
import { onlineServers } from '../../../../index';
import { ClientMinecraftServer } from 'src/minecraft/server';
import { setWhitelisted } from '../../../../utils';

export default class UpdateOperatorEvent extends SocketEvent {
	override readonly event = 'SET_WHITELIST';
	override readonly type = 'PANEL';
	override readonly parameters = ['string', 'string', 'boolean', 'ack'];

	override async onEvent(socket: AuthSocket, server: string, uuid: string, state: boolean, acknowledgement) {
		const minecraft: ClientMinecraftServer | null = await this.canAccessServer(socket, server);

		if (!minecraft) return socket.emit('error', 'You are not allowed to access this server!');

		if (!hasPermission(minecraft, ServerPermission.MANAGE_PLAYERS)) return socket.emit('error', 'You are not permitted to do this!');

		const serverSocket: AuthSocket | undefined = onlineServers.get(minecraft._id);
		if (!serverSocket) return socket.emit('error', "Server is not online, or socket wasn't found!");

		acknowledgement(await setWhitelisted(serverSocket, uuid, state));
	}
}
