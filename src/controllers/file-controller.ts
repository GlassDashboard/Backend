import { Authorized, CurrentUser, Get, JsonController, Params } from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import { Server, UserServer } from '~/decorators/server';

@Authorized()
@JsonController('/server/:server/file')
@JsonController('/server/:server/file/*')
export class FileController {
	@Get('/')
	async getServer(@CurrentUser() user: User, @Server() server: UserServer, @Params() params: { [key: string]: string }) {
		const path = params['0'] ?? '';
		return path;
	}
}
