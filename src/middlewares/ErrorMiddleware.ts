import { NextFunction, Request, Response } from 'express';
import { ExpressErrorMiddlewareInterface, Middleware, UnauthorizedError } from 'routing-controllers';

@Middleware({ type: 'after' })
export default class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
	error(error: Error, request: Request, response: Response, next: NextFunction) {
		response.status(500);
		if (error.name === 'AuthorizationRequiredError') response.status(401);

		response.json({
			error: true,
			code: error.name,
			message: error.message
		});
	}
}
