// Prometheus service, used to collect anonymous metrics about the usage of the Glass API.
// Mostly used to ensure ongoing performance and stability of the API.

import client from 'prom-client';
export const register = client.register;

export const errorCounter = new client.Counter({
	name: 'glass_http_errors',
	help: 'HTTP errors',
	labelNames: ['code', 'method', 'path']
});

export const requestCounter = new client.Counter({
	name: 'glass_http_requests',
	help: 'HTTP requests',
	labelNames: ['code', 'method', 'path']
});

export const outgoingBandwidthCounter = new client.Counter({
	name: 'glass_outgoing_bandwidth',
	help: 'Outgoing bandwidth'
});

export const socketConnectionRequestsCounter = new client.Counter({
	name: 'glass_socket_connection_requests',
	help: 'The total amount of socket connection requests made',
	labelNames: ['origin']
});

export const socketConnectionsCounter = new client.Counter({
	name: 'glass_socket_connections',
	help: 'The total amount of ongoing socket connections',
	labelNames: ['origin']
});
