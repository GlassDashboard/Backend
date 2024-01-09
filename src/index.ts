// Initialize .env file and load everything in process.env
require('dotenv').config();

// Add support for decorators
import 'reflect-metadata';

// Announce startup for logging
console.log('Glass Backend is now starting up');

// Initialize CDN
import * as cdn from '@service/cdn';
cdn.initialize();

// Public caches
import {
	ClerkExpressRequireAuth,
	Client,
	Session,
	SignedInAuthObject,
	User
} from '@clerk/clerk-sdk-node';

import * as socket from '~/socket';
import * as mongo from '~/data/mongo';
import clerk from '@clerk/clerk-sdk-node';

import { Action, createExpressServer } from 'routing-controllers';
import metrics from 'prometheus-api-metrics';

(async () => {
	// Connect to mongo database
	await mongo.connect();

	// Setup controllers
	const app = createExpressServer({
		cors: true,

		authorizationChecker: async (action: Action) => {
			return await new Promise((resolve) => {
				ClerkExpressRequireAuth()(action.request, action.response, () => {
					const auth = action.request.auth as SignedInAuthObject | undefined;
					resolve(auth != undefined);
				});
			});
		},

		currentUserChecker: async (action: Action) => {
			return await new Promise((resolve) => {
				ClerkExpressRequireAuth()(action.request, action.response, async () => {
					const auth = action.request.auth as SignedInAuthObject | undefined;
					if (!auth) return resolve(undefined);

					resolve(await clerk.users.getUser(auth.userId));
				});
			});
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

	console.log(`Ready to rock and roll! App running on port ${process.env.API_PORT}`);
})();
