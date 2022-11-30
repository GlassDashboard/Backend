import { AuthSocket } from '../../../authentication';
import SocketEvent from '../../SocketEvent';

import { processor as CommandProcessor } from '../../../../minecraft/commands';
import { hasPermission, ServerPermission } from '../../../../authentication/permissions';
import { io } from '../../../index';
import { ClientMinecraftServer } from 'src/minecraft/server';

export default class CommandEvent extends SocketEvent {
	override readonly event = 'EXECUTE_COMMAND';
	override readonly type = 'PANEL';
	override readonly parameters = ['string', 'string'];

	override async onEvent(socket: AuthSocket, server: string, command: string) {
		const minecraft: ClientMinecraftServer | null = await this.canAccessServer(socket, server);

		if (!minecraft) return socket.emit('error', 'You are not allowed to access this server!');

		if (!hasPermission(minecraft, ServerPermission.USE_CONSOLE)) return socket.emit('error', 'You are not permitted to do this!');

		const data = CommandProcessor(socket.discord!, command);
		if (data.cancelled) return socket.emit('error', 'This command has been blocked by Glass!');

		io.to(minecraft._id).emit(
			'EXECUTE_COMMAND',
			JSON.stringify({
				user: socket.discord!.tag,
				original: data.original,
				command: data.command
			})
		);
	}
}
