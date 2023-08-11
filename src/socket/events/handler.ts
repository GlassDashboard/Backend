// General handler for all socket events

import fs from 'fs';
import { join } from 'path';
import SocketEvent from './SocketEvent';
import { AuthenticatedSocket, ServerSocket } from '@service/authentication';

export const events: Map<string, SocketEvent> = new Map<string, SocketEvent>();

export const loadEvents = (path: string = join(__dirname, './impl')) => {
	if (!fs.existsSync(path)) return;
	fs.readdirSync(path).forEach((file: string) => {
		if (fs.statSync(join(path, file)).isDirectory()) {
			loadEvents(join(path, file));
		} else if (file.endsWith('.ts') || file.endsWith('.js')) {
			loadEvent(join(path, file));
		} else {
			console.error(`Failed to load ${file} -> Unknown file extenstion`);
		}
	});
};

const loadEvent = (file: string) => {
	try {
		const clazz: SocketEvent = new (require(file).default)();
		events.set(`${clazz.event}-${clazz.type}`, clazz);
	} catch (e) {
		console.error(`Failed to load ${file} -> An exception occurred while attempting to initialize and construct event`);
		console.error(e);
	}
};

// TODO: this code sucks, rewrite it later.
export const handleEvent = (socket: AuthenticatedSocket, event: string, args: any[]) => {
	const socketEvent: SocketEvent | undefined = events.get(`${event}-${socket.glass.origin}`);
	if (!socketEvent) return;

	if (args.length != socketEvent.parameters.length) return socket.emit('error', 'Invalid amount of arguments passed');

	if (socketEvent.parameters.length != 0) {
		let index = 0;
		for (const arg of args) {
			let required = socketEvent.parameters[index].toLowerCase();

			// Edge Cases
			if (required == 'buffer' && (arg == null || arg instanceof Buffer)) required = 'object';
			if (required == 'uint8array' && (arg == null || arg instanceof Uint8Array)) required = 'object';
			if (['ack', 'acknowledgement', 'func', 'function'].includes(required)) required = 'function';

			// Type check
			if ((typeof arg).toLowerCase() != required) {
				return socket.emit('error', `Argument #${index + 1} (${typeof arg}) does not match the required type: ${required}`);
			}
			index++;
		}
	}

	socketEvent.onEvent(socket, ...args);
};
