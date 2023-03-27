import { getModelForClass, modelOptions, pre, prop, Severity } from '@typegoose/typegoose';
import { randomBytes } from 'crypto';
import { decrypt, encrypt } from '../../authentication/encryption';

@pre<FTP>('save', async function (next) {
	if (!this.salt) this.salt = randomBytes(16).toString('hex');
	next();
})
@modelOptions({ options: { allowMixed: Severity.ALLOW } })
export class FTP {
	@prop({ required: true })
	public assignee: string;

	@prop({ required: true })
	public server: string;

	@prop({ required: true })
	public identifier: string;

	@prop({ required: true })
	public password: string;

	@prop()
	public salt: string;

	// Methods
	public toJson(): any {
		const data = JSON.parse(JSON.stringify(this));
		return {
			...data,
			password: decrypt(data.password),
			salt: undefined
		};
	}

	public static async create(user: string, server: string): Promise<FTP> {
		const salt = randomBytes(16).toString('hex');
		const password = randomBytes(16).toString('hex');

		const ftp = new FTPModel({
			assignee: user,
			server,
			identifier: randomBytes(6).toString('hex'),
			password: encrypt(password, salt),
			salt
		});

		await ftp.save();
		return ftp;
	}
}

// Export Models
export const FTPModel = getModelForClass(FTP);
