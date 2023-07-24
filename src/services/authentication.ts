// Authentication service, used to validate and authenticate users and servers.

import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { ServerTypes } from '~/minecraft/server';

import * as semver from 'semver';
import * as prometheus from '@service/prometheus';
import * as ServerManager from '@manager/server';
import { Server } from '@model/server';

const origins = ['server', 'panel'] as const;
type Origin = typeof origins[number];

export const authenticateSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
	// Fetch authentication data
	const auth = socket.handshake.auth;

	prometheus.socketConnectionRequestsCounter.inc({
		origin: auth && auth.origin ? auth.origin : 'unknown'
	});

	if (!auth || !auth.origin) return next(new Error('Missing authentication data'));

	// Check if the origin is valid
	if (!origins.includes(auth.origin)) return next(new Error('Invalid origin'));

	// Authenticate the origin
	const authenticated = await authenticateOrigin(socket, auth.origin);
	if (!authenticated) return next(new Error('Invalid authentication data'));

	// If authentication passed, let the socket connect
	next();
};

const authenticateOrigin = async (socket: Socket, origin: Origin): Promise<AuthenticatedSocket | null> => {
	const data = socket.handshake.auth;

	if (origin == 'server') {
		if (!data['token'] || !data['server_version'] || !data['plugin_version'] || !data['server_type']) return null;

		// Validate versions to ensure semver is used
		if (!semver.valid(data['server_version'])) return null;

		// Validate server type
		if (!ServerTypes.includes(data['server_type'].toUpperCase())) return null;

		// Validate token
		const server = await ServerManager.getServerByToken(data['token']);
		if (!server) return null;

		// Cache server details on socket, then authenticate the socket.
		const serverSocket = <ServerSocket>socket;
		serverSocket.glass = {
			origin: 'server',
			plugin_version: data['plugin_version'],
			server_version: data['server_version'],
			server_type: data['server_type'],
			server
		};

		return serverSocket;
	}

	return null;
};

// Containers to hold all data relating to glass
interface GlassContainer {
	origin: Origin;
}

interface ServerGlassContainer extends GlassContainer {
	origin: 'server';
	plugin_version: string;
	server_version: string;
	server_type: string;
	server: Server;
}

// Socket variants
export interface AuthenticatedSocket extends Socket {
	glass: GlassContainer;
}

export interface ServerSocket extends AuthenticatedSocket {
	glass: ServerGlassContainer;
}
