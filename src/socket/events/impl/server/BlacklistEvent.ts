import { io } from "../../../index";
import { AuthSocket } from "../../../authentication";
import SocketEvent from "../../SocketEvent";

export default class BlacklistEvent extends SocketEvent {

    override readonly event = 'BLACKLIST';
    override readonly type = 'PLUGIN'
    override readonly parameters = ['string']

    override async onEvent(socket: AuthSocket, players: string) {
        const data: any | null = this.safeParse(players)
        if (!data)
            return socket.emit('error', 'Malformed data provided for log')

        io.to('client' + socket.minecraft!._id.toLowerCase()).emit('BLACKLIST', socket.minecraft!!._id, players)
    }

}