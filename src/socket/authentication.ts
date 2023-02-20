import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { ServerModel } from '../data/models/server';
import { Discord, getDiscord } from '../authentication/discord';
import { getServer, MinecraftServer } from '../minecraft/server';
import { UploadStream } from './utils';
import { unsign } from 'cookie-signature';

export type SocketType = 'PANEL' | 'PLUGIN';

export default async function handleAuthentication(socket: Socket, next: (err?: ExtendedError) => void) {
	const auth = socket.handshake.auth;
	const authSocket = <AuthSocket>socket;
	authSocket.uploads = [];

	if (!auth || !auth.type) return next(new Error('No authentication or type parameters provided.'));
	if (!['panel', 'plugin'].includes(auth.type.toLowerCase())) return next(new Error('Invalid socket type provided.'));
	authSocket.type = auth.type.toUpperCase();

	// Handle panel authentication
	if (authSocket.type == 'PANEL') {
		// Ensure discord token provided is real
		if (!auth.discord) return next(new Error('No discord authentication was passed.'));

		const token = unsign(decodeURIComponent(auth.discord), process.env.COOKIE_SECRET || 'hello world');
		if (!token) return next(new Error('Invalid or unverified discord provided.'));

		const discord: Discord | null = await getDiscord(token);
		if (!discord) return next(new Error('Invalid or unverified discord provided.'));

		authSocket.discord = discord;
		return next();
	}

	// Handle plugin authentication
	if (authSocket.type == 'PLUGIN') {
		// Check if we recieved the server type
		const types = ['SPIGOT', 'PAPER', 'FORGE', 'FABRIC', 'BUNGEECORD', 'VELOCITY', 'UNKNOWN'];
		if (!auth.minecraft || !types.includes(auth.minecraft.toUpperCase())) return next(new Error('Invalid server type recieved.'));

		// Ensure server authentication token provided is real
		if (!auth.token) return next(new Error('Invalid server token was provided. Please set one in the config.yml'));

		// Get and validate the server version
		const versionRegex = /^([0-9]+)\.([0-9]+)(?:\.([0-9]+))?$/;
		if (!auth.version || !versionRegex.test(auth.version)) return next(new Error('Invalid server version provided.'));

		const minecraft: MinecraftServer | null = await getServer(auth.token);
		if (!minecraft) return next(new Error('Invalid server token provided. Make sure you provided the correct token in config.yml'));

		authSocket.minecraft = minecraft;

		// Save in db if server type is changed
		let startup: StartupData = {
			lastOnline: Date.now()
		};

		if (authSocket.minecraft.serverType != auth.type.toUpperCase()) startup.type = auth.minecraft.toUpperCase();
		if (authSocket.minecraft.version != auth.version) startup.version = auth.version;

		await ServerModel.findOneAndUpdate({ _id: authSocket.minecraft._id }, startup);
		return next();
	}

	next(new Error('An unexpected error has occurred. Please contact a developer.'));
}

// Represents a socket that has passed authentication
export interface AuthSocket extends Socket {
	type: SocketType;
	discord?: Discord;
	minecraft?: MinecraftServer;
	currentServer?: string | null;
	uploads: UploadStream[];
}

interface StartupData {
	type?: string;
	version?: string;
	lastOnline: number;
}
