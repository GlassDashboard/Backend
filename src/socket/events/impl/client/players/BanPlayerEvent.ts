import { AuthSocket } from "../../../../authentication";
import SocketEvent from "../../../SocketEvent";

import {
  hasPermission,
  ServerPermission,
} from "../../../../../authentication/permissions";
import { onlineServers } from "../../../../index";
import { ClientMinecraftServer } from "src/minecraft/server";
import { banPlayer } from "../../../../utils";

export default class BanPlayerEvent extends SocketEvent {
  override readonly event = "BAN_PLAYER";
  override readonly type = "PANEL";
  override readonly parameters = ["string", "string", "string"];

  override async onEvent(
    socket: AuthSocket,
    server: string,
    uuid: string,
    reason: string
  ) {
    const minecraft: ClientMinecraftServer | null = await this.canAccessServer(
      socket,
      server
    );

    if (!minecraft)
      return socket.emit("error", "You are not allowed to access this server!");

    if (!hasPermission(minecraft, ServerPermission.MANAGE_PLAYERS))
      return socket.emit("error", "You are not permitted to do this!");

    const serverSocket: AuthSocket | undefined = onlineServers.get(
      minecraft._id
    );
    if (!serverSocket)
      return socket.emit(
        "error",
        "Server is not online, or socket wasn't found!"
      );

    banPlayer(serverSocket, uuid, reason);
  }
}
