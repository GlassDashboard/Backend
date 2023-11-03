import { Get, JsonController } from 'routing-controllers';

@JsonController('/ping')
export class PingController {
	@Get('/')
	async getPing() {
		return {};
	}
}
