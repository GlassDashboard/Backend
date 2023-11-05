import { User } from '@clerk/clerk-sdk-node';
import { Server, ServerModel } from '@model/server';
import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { randomBytes } from 'crypto';
import { createId, ID } from '~/wrapper/typeid';
import { DEFAULT_PERMISSIONS } from '~/authentication/permissions';

@modelOptions({ options: { allowMixed: Severity.ALLOW, customName: 'Invites' } })
export class Invite {
	@prop({ _id: true })
	public _id: string;

	@prop({ required: true })
	public inviter: string;

	@prop({ required: true })
	public createdAt: number;

	@prop({ required: true })
	public uses: number;

	@prop({ required: true })
	public total: number;

	// Methods
	public toJson(): any {
		return JSON.parse(JSON.stringify(this));
	}

	public static async createFor(from: User, server: Server, uses: number = 1): Promise<Invite> {
		const invite = new InviteModel({
			_id: generateInviteId().toString(),
			inviter: from.id,
			createdAt: Math.floor(Date.now() / 1000),
			uses: 0,
			total: uses
		});

		await invite.save();
		return invite;
	}

	public async use(user: User): Promise<Server | null> {
		const document = this as unknown as DocumentType<Invite>;
		document.uses++;

		if (this.uses >= this.total) await InviteModel.deleteOne({ _id: this._id }).exec();
		else await document.save();

		const server = await ServerModel.findById(this._id);
		if (!server) return null;

		await server.addUser(user);
		return server;
	}
}

// Export Models
export const InviteModel = getModelForClass(Invite);

// ID Generators
export const generateInviteId = (): ID<'invite'> => {
	return createId('invite');
};
