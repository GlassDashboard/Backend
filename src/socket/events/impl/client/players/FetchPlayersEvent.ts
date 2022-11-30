import { onlineServers } from "../../../../index";
import { AuthSocket } from "../../../../authentication";
import SocketEvent from "../../../SocketEvent";
import { ClientMinecraftServer } from "src/minecraft/server";
import {getOnlinePlayers} from "../../../../utils";

export default class PlayerListEvent extends SocketEvent {

    override readonly event = 'FETCH_PLAYERS';
    override readonly type = 'PANEL'
    override readonly parameters = ['string', 'ack']

    override async onEvent(socket: AuthSocket, server: string, acknowledgement) {

        const minecraft: ClientMinecraftServer | null = await this.canAccessServer(socket, server)

        if (!minecraft)
            return socket.emit('error', 'You are not allowed to access this server!')

        const serverSocket: AuthSocket | undefined = onlineServers.get(minecraft._id)
        if (!serverSocket)
            return socket.emit('error', 'Server is not online, or socket wasn\'t found!')

        const players = await getOnlinePlayers(serverSocket)
        acknowledgement(players)

    }

}