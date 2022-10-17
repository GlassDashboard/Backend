// Handles socket communication between the panel and plugins with a signel websocket

import { Server, Socket } from "socket.io";
import { server } from "../http";
import handleAuthentication, {AuthSocket} from './authentication'
import assignRooms from "./events/assigner";
import * as handler from "./events/handler";

if (!server) {
    console.error("Server is not initialized! Express has to be running before socket.io can be initialized.")
    process.exit(-1)
}

// Create Socket.IO Instance
export var io;
export var onlineServers: string[] = []

export function start() {
    console.log('Starting Socket.IO Server...')

    io = new Server(server, {
        path: '/socket',
        maxHttpBufferSize: 1e8,
        cors: {
            origin: process.env.CORS_URL,
            credentials: true
        }
    });

    handler.loadEvents()
    console.log(`Loaded ${handler.events.size} events in socket.io`)

    // Handle Socket.IO authentication
    io.use(handleAuthentication)
    io.use(assignRooms)

    // Debug
    io.on('connection', (socket: AuthSocket) => {
		onlineServers.push(socket.id)
		
		if (socket.type == 'PLUGIN')
			console.log(`[${socket.minecraft!._id}] Server flagged as online!`)

        socket.on('disconnect', () => {
			onlineServers = onlineServers.filter((s) => s != socket.id)

			if (socket.type == 'PLUGIN')
				console.log(`[${socket.minecraft!._id}] Server flagged as offline!`)
        })

        socket.onAny((event, ...args) => {
            handler.handleEvent(socket, event, args)
        });
    })
}