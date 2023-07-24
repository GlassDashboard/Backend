import { NextFunction, Request, Response } from 'express';
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers';
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
			message: error.message,
			stack: error.stack ? parseStack(error.stack!) : undefined
		});
	}
}

// Formats a stack trace into a more readable format
const parseStack = (stack: string): string[] => {
	return stack
		.split('\n')
		.filter((l) => l.startsWith('    at '))
		.map((l) => l.substring(7))
		.map((l) => {
			const parts = l.split(' ');
			const file = parts.pop()?.replace('(', '').replace(')', '') || '<unknown>';
			const location = parts.pop();
			const related = !file?.includes('node_modules/') && !file?.includes('node:internal/');

			return {
				location,
				file: file.substring(file.indexOf('src/')),
				related
			};
		})
		.filter((l) => l.related)
		.map((l) => `${l.location} at ${l.file}`);
};
