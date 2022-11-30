import { AuthSocket, SocketType } from '../authentication';
import { ClientMinecraftServer } from '../../minecraft/server';

export default abstract class SocketEvent {
	abstract readonly event: string;
	abstract readonly type: SocketType;

	readonly parameters: string[] = [];

	abstract onEvent(socket: AuthSocket, ...args: any[]);

	async canAccessServer(socket: AuthSocket, id: string): Promise<ClientMinecraftServer | null> {
		const servers = await socket.discord!.getServers();
		const server: ClientMinecraftServer | undefined = servers.find((server) => server._id.toLowerCase() == id.toLowerCase());

		return !server ? null : server;
	}

	safeParse(data: string | string[]): any | null {
		// It's possible the data we get is also an array,
		// so we will take the last element if that's the case.
		if (Array.isArray(data)) return this.safeParse(data[data.length - 1]);

		try {
			return JSON.parse(data);
		} catch (_) {
			return null;
		}
	}
}
