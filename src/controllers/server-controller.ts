import { Authorized, Get, JsonController, Param } from 'routing-controllers';
import { ServerModel } from '@model/server';

@Authorized()
@JsonController('/server/:server')
export class ServerController {
	@Get('/')
	getServer(@Param('server') id: string) {
		return ServerModel.findOne({ id });
	}
}
