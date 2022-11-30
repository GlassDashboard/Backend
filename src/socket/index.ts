// Handles socket communication between the panel and plugins with a signel websocket

import { Server, Socket } from "socket.io";
import { server } from "../http";
import handleAuthentication, { AuthSocket } from "./authentication";
import assignRooms from "./events/assigner";
import * as handler from "./events/handler";

if (!server) {
  console.error(
    "Server is not initialized! Express has to be running before socket.io can be initialized."
  );
  process.exit(-1);
}

// Create Socket.IO Instance
export var io;
export var onlineServers = new Map<string, AuthSocket>();

export const start = async () => {
  console.log("Starting Socket.IO Server...");

  io = new Server(server, {
    path: "/socket",
    maxHttpBufferSize: 2e6,
    cors: {
      origin: process.env.CORS_URL,
      credentials: true,
    },
  });

  handler.loadEvents();
  console.log(`Loaded ${handler.events.size} events in socket.io`);

  // Handle Socket.IO authentication
  io.use(handleAuthentication);
  io.use(assignRooms);

  // Debug
  io.on("connection", (socket: AuthSocket) => {
    socket.setMaxListeners(200);

    if (socket.type == "PLUGIN") {
      console.log(`[${socket.minecraft!._id}] Server flagged as online!`);
      onlineServers.set(socket.minecraft!._id, socket);

      // Notify clients of server change
      io.to(`client` + socket.minecraft!._id.toLowerCase()).emit(
        "SERVER_ONLINE"
      );
    }

    socket.on("disconnect", () => {
      if (socket.type == "PLUGIN") {
        onlineServers.delete(socket.minecraft!._id);
        console.log(`[${socket.minecraft!._id}] Server flagged as offline!`);

        // Notify clients of server change
        io.to(`client` + socket.minecraft!._id.toLowerCase()).emit(
          "SERVER_OFFLINE"
        );
      }
    });

    socket.onAny((event, ...args) => {
      handler.handleEvent(socket, event, args);
    });
  });
};
