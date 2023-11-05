import { User } from '@clerk/clerk-sdk-node';
import { InviteModel } from '@model/invite';
import { CurrentUser, Get, HttpError, JsonController, Param } from 'routing-controllers';
import * as ServerManager from '@manager/server';

@JsonController('/join')
export class PingController {
	@Get('/:id')
	async joinServer(@CurrentUser() user: User, @Param('id') id: string) {
		const invite = await InviteModel.findById(id);
		if (!invite) throw new HttpError(404, 'This invite has expired or has been deleted.');

		const server = await invite.use(user);
		if (!server || server.suspended)
			return new HttpError(500, "The server associated with this invite doesn't exist.");

		return {
			server: ServerManager.scopeServer(server, [], user)
		};
	}
}
