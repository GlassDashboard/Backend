import { getModelForClass, modelOptions, plugin, prop, Severity } from '@typegoose/typegoose';
import { AutoIncrementSimple } from '@typegoose/auto-increment';
import { ServerModel } from './server';
import {MinecraftServer} from "../../minecraft/server";
import {Discord, RawDiscord} from "../../authentication/discord";

@plugin(AutoIncrementSimple, [{ field: 'join' }])
@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class User {
	@prop({ _id: true })
	public _id: string;

	@prop({ required: true })
	public tag: string;

	@prop({ required: true })
	public avatar: string;

	@prop({ required: true })
	public createdAt: number;

	@prop({ required: true })
	public join: number;

	@prop({ default: undefined })
	public admin?: boolean;

	@prop({ default: undefined })
	public flags?: string[];

	@prop({ default: undefined })
	public invite: string;

	@prop({ default: undefined })
	public suspended?: string;

	// Methods
	public getAvatarURL(): string {
		return `https://cdn.discordapp.com/avatars/${this._id}/${this.avatar}.${this.avatar.startsWith('a_') ? 'gif' : 'png'}`;
	}

    public getAssociatedServers(): Promise<MinecraftServer[]> {
        return User.getAssociatedServers(this._id)
    }

	public toJson(): any {
		return JSON.parse(JSON.stringify(this));
	}

	public static async create(discord: RawDiscord): Promise<User> {
		const user = new UserModel({
			_id: discord.id,
			tag: discord.username + '#' + discord.discriminator,
			avatar: discord.avatar,
			flags: ['beta_tester'],
			createdAt: Date.now()
		});

		await user.save();
		return user;
	}

    public static getAssociatedServers(user: string): Promise<MinecraftServer[]> {
        const servers = ServerModel.find({
            $or: [ { owner: user } , { users: { $elemMatch: { _id: user }}} ]
        })

        return servers.map((s) => s.toJson())
    }
}

// Export Models
export const UserModel = getModelForClass(User);
