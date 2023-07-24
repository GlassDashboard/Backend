// Initialize .env file and load everything in process.env
require('dotenv').config();

// Add support for decorators
import 'reflect-metadata';

// Announce startup for logging
console.log('Glass Backend is now starting up');

import * as socket from '~/socket';
import * as mongo from '~/data/mongo';
import clerk from '@clerk/clerk-sdk-node';

import { Action, createExpressServer } from 'routing-controllers';
import metrics from 'prometheus-api-metrics';

function getCookie(action: Action, cookie: string): string | undefined {
	const header = action.request.headers['cookie'];
	if (!header) return undefined;

	const data = header.split(';');
	for (const item of data) {
		const parts = item.split('=');
		if (parts[0].trim() == cookie) return parts[1].trim();
	}

	return undefined;
}

const getSession = (action: Action): string | undefined => {
	const cookie = getCookie(action, '__session');
	if (cookie) return cookie;

	const header = action.request.headers['authorization'];
	if (!header) return undefined;

	const data = header.split(' ');
	if (data.length != 2 || data.shift() != 'Bearer') return undefined;

	return data.shift();
};

(async () => {
	// Connect to mongo database
	await mongo.connect();

	// Setup controllers
	const app = createExpressServer({
		cors: true,

		authorizationChecker: async (action: Action) => {
			const session = getSession(action);
			if (!session) return false;

			return clerk
				.verifyToken(session)
				.then(() => true)
				.catch(() => false);
		},

		currentUserChecker: async (action: Action) => {
			const session = getSession(action);
			if (!session) return undefined;

			const data = await clerk.verifyToken(session);
			if (!data) return undefined;

			return clerk.users.getUser(data.sub);
		},

		defaults: {
			nullResultCode: 404,
			undefinedResultCode: 204,

			paramOptions: {
				required: true
			}
		},

		controllers: [__dirname + '/controllers/**/*.ts'],
		middlewares: [__dirname + '/middlewares/**/*.ts'],
		interceptors: [__dirname + '/interceptors/**/*.ts'],

		defaultErrorHandler: false
	});

	app.use(metrics());
	app.listen(process.env.API_PORT);

	// Start socket.io server
	socket.start();

	// // Start FTP server
	// ftp.start();

	console.log(`Ready to rock and roll!`);
})();
