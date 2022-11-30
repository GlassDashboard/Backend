// Controls the main server for the backend
// Express and Socket.IO will hook into this singleton for them to use the same port

import { Express } from 'express';
import http from 'http';

export var server;

export function createServer(app: Express) {
	server = http.createServer(app);

	const port = process.env.PORT || 3000;
	server.listen(port, () => {
		console.log(`HTTP Server running on *:${port} (express & socketio)`);
	});
}
