import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { randomBytes } from 'crypto';

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
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

	@prop({ default: undefined })
	public invalid?: boolean;

    @prop({ default: undefined })
    public adminOnly?: boolean;

	// Methods
	public toJson(): any {
		return JSON.parse(JSON.stringify(this));
	}

	public static async create(owner: string, uses: number = 1): Promise<Invite> {
		const invite = new InviteModel({
			_id: randomBytes(12).toString('hex'),
			inviter: owner,
			createdAt: Date.now(),
            total: uses,
            uses
		});

		await invite.save();
		return invite;
	}
}

// Export Models
export const InviteModel = getModelForClass(Invite);
