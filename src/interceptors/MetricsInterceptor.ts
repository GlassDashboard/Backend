import { Action, Interceptor, InterceptorInterface } from 'routing-controllers';
import * as prometheus from '@service/prometheus';

@Interceptor({ priority: 10 })
export class MetricsInterceptor implements InterceptorInterface {
	intercept(action: Action, result: any) {
		prometheus.requestCounter.inc({
			code: action.response.statusCode.toString(),
			method: action.request.method,
			path: action.request.route.path
		});

		if (!!action.response.socket)
			prometheus.outgoingBandwidthCounter.inc(action.response.socket.bytesWritten);

		return result;
	}
}
