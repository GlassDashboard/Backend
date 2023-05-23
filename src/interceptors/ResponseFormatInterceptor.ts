import { Action, Interceptor, InterceptorInterface } from 'routing-controllers';

const cleanMongo = (data: any) => {
	if (!data) return data;

	if (Array.isArray(data)) {
		for (const item of data) cleanMongo(item);
		return data;
	}

	if (data.__v) delete data.__v;
	if (data._id) {
		data.id = data._id;
		delete data._id;
	}

	return data;
};

@Interceptor({ priority: 1 })
export class ResponseFormatInterceptor implements InterceptorInterface {
	intercept(action: Action, content: any) {
		let data;

		switch (typeof content) {
			case 'object':
				data = JSON.parse(JSON.stringify(content));
				break;
			default:
				data = content;
		}

		// If the response is a string, just send it
		if (typeof content === 'string') return action.response.send(content);

		// Handle consistency fields
		if (!data) return action.response.status(204).json({});
		if (!data.message) data.message = 'OK';

		data.error = Math.floor(action.response.statusCode / 100) !== 2;

		// Cleanup mongo fields
		cleanMongo(data);

		// Send response
		return data;
	}
}
