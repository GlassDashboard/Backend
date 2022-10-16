import { Server, ServerModel } from '../data/models/server'

export interface MinecraftServer extends Server {}

export async function getServer(token: string): Promise<MinecraftServer | null> {
    return await ServerModel.findOne({ token: token }) as MinecraftServer | null
}