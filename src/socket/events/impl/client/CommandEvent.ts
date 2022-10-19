import { AuthSocket } from "../../../authentication";
import SocketEvent from "../../SocketEvent";

import { processor as CommandProcessor } from '../../../../minecraft/commands'
import { ServerPermission } from "../../../../authentication/permissions";
import {io} from "../../../index";

export default class CommandEvent extends SocketEvent {

    override readonly event = 'EXECUTE_COMMAND';
    override readonly type = 'CLIENT'
    override readonly parameters = ['string', 'string']

    override async onEvent(socket: AuthSocket, server: string, command: string) {
        
        const minecraft = await this.canAccessServer(socket, server)

        if (!minecraft)
            return socket.emit('error', 'You are not permitted to do this!')

        if (!minecraft.hasPermission(socket.discord!.id, ServerPermission.USE_CONSOLE))
            return socket.emit('error', 'You are not permitted to do this!')

        const data = CommandProcessor(socket.discord!, command)
        if (data.cancelled) return socket.emit('error', 'This command has been blocked by Glass!')

        io.to(minecraft._id).emit('EXECUTE_COMMAND', JSON.stringify({
            user: socket.discord!.tag,
            original: data.original,
            command: data.command
        }))

    }

}