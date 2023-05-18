import { Authorized, CurrentUser, Get, JsonController, Param } from 'routing-controllers';
import { ServerModel } from '@model/server';
import { User } from '@clerk/clerk-sdk-node';

@Authorized()
@JsonController('/server/:server')
export class ServerController {
	@Get('/')
	getServer(@CurrentUser() user: User, @Param('server') id: string) {
		return {
			id: 'test',
			user
		};
	}
}
