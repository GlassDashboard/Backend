import { Authorized, CurrentUser, Get, HttpError, JsonController } from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import * as ServerManager from '@manager/server';

@Authorized()
@JsonController('/me')
export class FileController {
	@Get('/servers')
	async getServer(@CurrentUser() user: User) {
		return (await ServerManager.getServers(user.id)).map((s) => {
			return {
				...ServerManager.scopeServer(s, [], user),
				status: s.getStatus()
			};
		});
	}
}
