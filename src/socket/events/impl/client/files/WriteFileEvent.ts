import { AuthSocket } from "../../../../authentication";
import SocketEvent from "../../../SocketEvent";

import {hasPermission, ServerPermission } from "../../../../../authentication/permissions";
import {onlineServers} from "../../../../index";
import { ClientMinecraftServer } from "src/minecraft/server";
import {User} from "../../../../../data/models/user";
import { writeFile, UploadStream } from "../../../../utils";
import { Readable, Writable } from "stream";

/*

Note:
This file is not the same as UPLOAD_FILE, however it is related
as this is used to pipe buffers to the server

*/

export default class UploadFileEvent extends SocketEvent {

    override readonly event = 'WRITE_FILE';
    override readonly type = 'PANEL'
    override readonly parameters = ['string', 'string', 'uint8array']

    override async onEvent(socket: AuthSocket, server: string, id: string, buffer: Uint8Array | null) {

        const minecraft: ClientMinecraftServer | null = await this.canAccessServer(socket, server)

        if (!minecraft)
            return socket.emit('error', 'You are not allowed to access this server!')

        if (!hasPermission(minecraft, ServerPermission.WRITE_FILES))
            return socket.emit('error', 'You are not permitted to do this!')

        const serverSocket: AuthSocket | undefined = onlineServers.get(minecraft._id)
        if (!serverSocket)
            return socket.emit('error', 'Server is not online, or socket wasn\'t found!')

        const stream = serverSocket.uploads.find((stream: UploadStream) => stream.id == id);
        if (!stream)
            return socket.emit('error', 'Stream provided was not found, note that the ID is case sensitive.')

        if (!buffer) // End stream when finished
            return stream.end()


        // Stream will handle the transfer speeds
        stream._write(buffer, 'binary', () => {})
    }

}