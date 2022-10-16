import { AuthSocket } from "../authentication";
import {MinecraftServer} from "../../minecraft/server";

export default abstract class SocketEvent {
    abstract readonly event: string;
    abstract readonly type: string;

    readonly parameters: string[] = [];

    abstract onEvent(socket: AuthSocket, ...args: any[])

    async canAccessServer(socket: AuthSocket, id: string): Promise<MinecraftServer | null> {
        const servers = await socket.discord!.getServers()
        const server: MinecraftServer | undefined = servers.find((server) => server._id == id)

        return !server ? null : server
    }
}