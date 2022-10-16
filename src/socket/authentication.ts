import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { Discord, getDiscord } from "../authentication/discord";
import {getServer, MinecraftServer} from "../minecraft/server";

export type SocketType = 'PANEL' | 'PLUGIN'

export default async function handleAuthentication(socket: Socket, next: (err?: ExtendedError) => void) {
    const auth = socket.handshake.auth;
    const authSocket = <AuthSocket>socket

    if (!auth || !auth.type) return next(new Error("No authentication or type parameters provided."))
    if (!['panel', 'plugin'].includes(auth.type.toLowerCase())) return next(new Error("Invalid socket type provided."))
    authSocket.type = auth.type.toUpperCase()

    // Handle panel authentication
    if (authSocket.type == 'PANEL') {
        // Ensure discord token provided is real
        if (!auth.discord) return next(new Error("No discord authentication was passed."))

        const discord: Discord | null = await getDiscord(auth.discord)
        if (!discord) return next(new Error('Invalid or unverified discord provided.'))

        authSocket.discord = discord
        return next()
    }

    // Handle plugin authentication
    if (authSocket.type == 'PLUGIN') {
        // Ensure server authentication token provided is real
        if (!auth.token) return next(new Error('Invalid server token was provided. Please set one in the config.yml'));

        const minecraft: MinecraftServer | null = await getServer(auth.token);
        if (!minecraft) return next(new Error("Invalid server token provided. Make sure you provided the correct token in config.yml"))

        authSocket.minecraft = minecraft;
        return next()
    }

    next(new Error("An unexpected error has occurred. Please contact a developer."))
}

// Represents a socket that has passed authentication
export interface AuthSocket extends Socket {
    type: SocketType,
    discord?: Discord,
    minecraft?: MinecraftServer
}