import * as ftpd from 'ftp-srv';
import { onlineServers } from '../socket';
import { User, UserModel } from '../data/models/user';
import { FtpConnection } from 'ftp-srv';
import GlassFileSystem from './GlassFileSystem';
import { AuthSocket } from '../socket/authentication';
import { FTPModel } from '../data/models/ftp';
import { readFileSync } from 'fs';
import { SecureContextOptions } from 'tls';
import { resolve } from 'path';

// Get tls key and cert
let tls: SecureContextOptions | false = false;
if (process.env.FTP_TLS_KEY != 'off' && process.env.FTP_TLS_CERT != 'off') {
	tls = {
		key: readFileSync(resolve(__dirname, process.env.FTP_TLS_KEY as string)),
		cert: readFileSync(resolve(__dirname, process.env.FTP_TLS_CERT as string))
	};
}

// Create ftp server
const server = new ftpd.FtpSrv({
	url: 'ftp' + (tls ? 's' : '') + '://' + process.env.FTP_BIND + ':' + process.env.FTP_PORT,
	anonymous: false,
	tls,
	greeting: [' ', 'Glass', 'Welcome to Glass FTP Server', 'This feature is still in development, so expect a few bugs.', ' ']
});

server.on('login', async ({ connection, username: id, password }, resolve, reject: any) => {
	// Get FTP connection details
	const ftpDetails = await FTPModel.findOne({ identifier: id, password });
	if (!ftpDetails) {
		await connection.reply(404, '[Glass] Invalid username or password');
		return reject('Invalid username or password');
	}

	// Check if server is online
	const server: AuthSocket | undefined = onlineServers.get(ftpDetails.server);
	if (!server) {
		await connection.reply(404, '[Glass] Server is not currently online or valid, try starting the server up and make sure it is connected properly');
		return reject('Server is not currently online');
	}

	// Fetch user from database
	const user: User | null = await UserModel.findById(ftpDetails.assignee);
	if (user == null) return reject('Invalid username or password');

	return resolve({ fs: new GlassFileSystem({ server, user, connection }) });
});

// Represents a ftp's connection that was successfully established
export interface AuthenticatedConnection {
	server: AuthSocket;
	user: User;
	connection: FtpConnection;
}

export const start = async () => {
	server.listen().then(() => {
		console.log('FTP Server listening on port ' + process.env.FTP_PORT);
	});
};
