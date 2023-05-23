import { NextFunction, Request, Response } from 'express';
import { ExpressErrorMiddlewareInterface, HttpError, Middleware, UnauthorizedError } from 'routing-controllers';
import * as prometheus from '@service/prometheus';

@Middleware({ type: 'after' })
export default class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
	error(error: Error, request: Request, response: Response, next: NextFunction) {
		response.status(500);
		if (error instanceof HttpError) response.status(error.httpCode);

		prometheus.errorCounter.inc({
			code: response.statusCode.toString(),
			method: request.method,
			path: request.route.path
		});

		response.json({
			error: true,
			code: error.name,
			message: error.message
		});
	}
}
