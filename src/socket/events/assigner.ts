import { ExtendedError } from "socket.io/dist/namespace";
import { AuthSocket } from "../authentication";
import { User } from "../../data/models/user";
import { MinecraftServer } from "../../minecraft/server";
import { io } from "../index";

// Handles assigning rooms for sockets when first connecting

export default function assignRooms(
  socket: AuthSocket,
  next: (err?: ExtendedError) => void
) {
  socket.join(socket.type);

  if (socket.type == "PANEL") {
    socket.join(socket.discord!.tag);
    socket.discord!.getUser().then((user: User) => {
      user.getAssociatedServers().then((servers: MinecraftServer[]) => {
        servers.forEach((server: MinecraftServer) => {
          socket.join(`client` + server._id.toLowerCase());
        });
      });
    });
  } else if (socket.type == "PLUGIN") {
    socket.join(socket.minecraft!._id);
  }

  next();
}
