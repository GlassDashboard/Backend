// Utils for discord authentication
import fetch from 'node-fetch'
import {User, UserModel} from "../data/models/user";
import {MinecraftServer} from "../minecraft/server";

export interface RawDiscord {
    // From Discord API
    accent_color: string;
    avatar: string;
    avatar_decoration: string;
    banner: string;
    banner_color: string;
    discriminator: string;
    email: string;
    flags: number;
    id: string;
    locale: string;
    mfa_enabled: boolean;
    public_flags: number;
    username: string;
    verified: boolean;

    // Discord API Errors
    error?: boolean;
    code?: number;
    message?: string;
}

export interface Discord extends RawDiscord {
    // Custom Data
    tag: string;
    avatar_uri: string;
    getUser: () => Promise<User>;
    getServers: () => Promise<MinecraftServer[]>
}

export async function getDiscord(token: string): Promise<Discord | null> {
    const data: RawDiscord = await fetch(`https://discordapp.com/api/users/@me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then((res) => res.json());

    if (data.error || data.code === 0 || !data.verified) return null

    return {
        ...data,
        getUser: () => getUserFromDiscord(data),
        getServers: () => Server.
        tag: data.username + '#' + data.discriminator,
        avatar_uri: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${data.avatar.startsWith('a_') ? 'gif' : 'png'}`
    } as Discord
}

export async function getUserFromDiscord(discord: RawDiscord): Promise<User> {
    let user: User | null = await UserModel.findOne({
        _id: discord.id
    });

    if (user) return user;

    user = await User.create(discord)
    return user;
}