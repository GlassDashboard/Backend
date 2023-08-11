import { AuthenticatedSocket, Origin } from '@service/authentication';

export default abstract class SocketEvent {
	abstract readonly event: string;
	abstract readonly type: Origin;

	readonly parameters: string[] = [];

	abstract onEvent(socket: AuthenticatedSocket, ...args: any[]);

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
