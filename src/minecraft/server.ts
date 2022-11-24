import {Server, ServerModel, Subuser} from '../data/models/server'
import Permissionable from "../authentication/permissionable";
import { AuthSocket } from 'src/socket/authentication';

export interface MinecraftServer extends Server {
    getSocket: () => AuthSocket | null
}

export interface ClientMinecraftServer extends MinecraftServer, Permissionable {
    role: string
}

export function toClientServer(server: MinecraftServer, user: string): ClientMinecraftServer {
    if (server.owner === user)
        return {
            ...server,
            role: 'Owner',
            permissions: -1
        } as ClientMinecraftServer

    const subuser: Subuser | undefined = server.users.find((s: Subuser) => s._id == user)

    if (!subuser) // Well this is awkward, we'll default to member with 0 perms to prevent any abuse
        return {
            ...server,
            role: 'Unknown',
            permissions: 0
        } as ClientMinecraftServer

    return {
        ...server,
        role: 'Member',
        permissions: subuser.permissions
    } as ClientMinecraftServer
}

export async function getServer(token: string): Promise<MinecraftServer | null> {
    return await ServerModel.findOne({ token: token }) as MinecraftServer | null
}