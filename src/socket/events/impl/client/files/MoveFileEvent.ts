import { AuthSocket } from "../../../../authentication";
import SocketEvent from "../../../SocketEvent";

import {
  hasPermission,
  ServerPermission,
} from "../../../../../authentication/permissions";
import { onlineServers } from "../../../../index";
import { ClientMinecraftServer } from "src/minecraft/server";
import { moveFile } from "../../../../utils";
import { User } from "../../../../../data/models/user";

export default class MoveFileEvent extends SocketEvent {
  override readonly event = "MOVE_FILE";
  override readonly type = "PANEL";
  override readonly parameters = [
    "string",
    "string",
    "string",
    "boolean",
    "ack",
  ];

  override async onEvent(
    socket: AuthSocket,
    server: string,
    from: string,
    to: string,
    root: boolean,
    acknowledgement
  ) {
    const minecraft: ClientMinecraftServer | null = await this.canAccessServer(
      socket,
      server
    );

    if (!minecraft)
      return socket.emit("error", "You are not allowed to access this server!");

    if (!hasPermission(minecraft, ServerPermission.WRITE_FILES))
      return socket.emit("error", "You are not permitted to do this!");

    const serverSocket: AuthSocket | undefined = onlineServers.get(
      minecraft._id
    );
    if (!serverSocket)
      return socket.emit(
        "error",
        "Server is not online, or socket wasn't found!"
      );

    if (root) {
      // This allows viewing container files, you shouldn't ever need to access these
      // as a normal user.
      const user: User = await socket.discord!.getUser();
      if (!user.admin)
        return socket.emit("error", "You are not permitted to do this!");
    }

    await moveFile(serverSocket, from, to, root);
    acknowledgement();
  }
}
