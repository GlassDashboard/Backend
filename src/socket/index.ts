// Handles socket communication between the panel and plugins with a signel websocket

import { Server, Socket } from 'socket.io';
import * as authentication from '@service/authentication';
import { AuthenticatedSocket, ServerSocket, UserSocket } from '@service/authentication';
// import handleAuthentication, { AuthSocket } from './authentication';
// import assignRooms from './events/assigner';
import * as handler from './events/handler';

// Create Socket.IO Instance
export var io: Server;
let sockets: Map<string, authentication.AuthenticatedSocket> = new Map();

export const getSocketOrNull = (id: string): authentication.AuthenticatedSocket | null => {
	return sockets.get(id) || null;
};

export const start = async () => {
	console.log('Starting Socket.IO Server...');

	io = new Server({
		path: '/',
		serveClient: false,
		maxHttpBufferSize: 2e6,
		cors: {
			origin: process.env.WEB_URL,
			credentials: true
		}
	});

	io.listen(parseInt(process.env.WS_PORT!));
	io.use(authentication.authenticateSocket);

	// Listen to socket events
	handler.loadEvents();

	io.on('connection', (socket: Socket) => {
		let authSocket = <AuthenticatedSocket>socket;
		if (authSocket.glass.origin == 'server') {
			const serverSocket = <ServerSocket>socket;
			sockets.set(serverSocket.glass.server._id, serverSocket);
			console.log(
				`[server:status] ${serverSocket.glass.server.name} (${serverSocket.glass.server._id}) connected`
			);

			socket.on('disconnect', () => {
				sockets.delete(serverSocket.glass.server._id);
				console.log(
					`[server:status] ${serverSocket.glass.server.name} (${serverSocket.glass.server._id}) disconnected`
				);
			});
		}

		if (authSocket.glass.origin == 'panel') {
			const userSocket = <UserSocket>socket;
			console.log(
				`[panel:user] ${userSocket.glass.user.username} (${userSocket.glass.user.id}) is now online`
			);

			socket.on('disconnect', () => {
				console.log(
					`[panel:user] ${userSocket.glass.user.username} (${userSocket.glass.user.id}) is now offline`
				);
			});
		}

		socket.onAny((event, ...args) => {
			handler.handleEvent(authSocket, event, args);
		});
	});
};
