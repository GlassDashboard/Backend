import { io } from '../../../index';
import { AuthSocket } from '../../../authentication';
import SocketEvent from '../../SocketEvent';

export default class WhitelistEvent extends SocketEvent {
	override readonly event = 'WHITELIST';
	override readonly type = 'PLUGIN';
	override readonly parameters = ['string'];

	override async onEvent(socket: AuthSocket, players: string) {
		const data: any | null = this.safeParse(players);
		if (!data) return socket.emit('error', 'Malformed data provided for log');

		io.to('client' + socket.minecraft!._id.toLowerCase()).emit('WHITELIST', socket.minecraft!!._id, players);
	}
}
