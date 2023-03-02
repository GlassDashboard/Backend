import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import { randomBytes } from 'crypto';

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

	// Methods
	public toJson(): any {
		return JSON.parse(JSON.stringify(this));
	}

	public static async create(user: string, server: string): Promise<FTP> {
		const ftp = new FTPModel({
			assignee: user,
			server,
			identifier: randomBytes(6).toString('hex'),
			password: randomBytes(16).toString('hex')
		});

		await ftp.save();
		return ftp;
	}
}

// Export Models
export const FTPModel = getModelForClass(FTP);
