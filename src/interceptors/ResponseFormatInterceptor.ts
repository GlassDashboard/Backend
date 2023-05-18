import { Action, Interceptor, InterceptorInterface } from 'routing-controllers';

@Interceptor()
export class ResponseFormatInterceptor implements InterceptorInterface {
	intercept(action: Action, content: any) {
		let data;

		switch (typeof content) {
			case 'object':
				data = JSON.parse(JSON.stringify(content));
				break;
			case 'string':
				data = { message: content };
				break;
			default:
				data = content;
		}

		if (!data.message) data.message = 'OK';
		data.error = !(action.response.statusCode >= 200 && action.response.statusCode < 300);

		return {
			...data
		};
	}
}
