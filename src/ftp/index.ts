import * as ftpd from 'ftp-srv';
import * as fs from 'fs';
import { onlineServers } from '../socket';
import { User, UserModel } from '../data/models/user';
import { FtpConnection } from 'ftp-srv';
import GlassFileSystem from './GlassFileSystem';
import { AuthSocket } from '../socket/authentication';
import { FTPModel } from '../data/models/ftp';
import { SecureContextOptions } from 'tls';
import { resolve } from 'path';
import { decrypt } from '../authentication/encryption';

// Get tls key and cert
let tls: SecureContextOptions | false = false;
if (process.env.FTP_TLS_KEY != 'off' && process.env.FTP_TLS_CERT != 'off') {
	const cwd = process.cwd();

	// Get path for key and cert
	const keyPath = resolve(cwd, process.env.FTP_TLS_KEY as string);
	const certPath = resolve(cwd, process.env.FTP_TLS_CERT as string);

	// Check if file exists
	if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
		console.log('TLS key or cert does not exist, disabling TLS.');
		console.log('Current working directory: ' + cwd);
		console.log('Current key path: ' + keyPath);
		console.log('Current cert path: ' + certPath);
	} else
		tls = {
			key: fs.readFileSync(resolve(cwd, process.env.FTP_TLS_KEY as string)),
			cert: fs.readFileSync(resolve(cwd, process.env.FTP_TLS_CERT as string))
		};
}

// Get ftp bind
const bind = 'ftp' + (tls ? 's' : '') + '://' + process.env.FTP_BIND + ':' + process.env.FTP_PORT;

// Create ftp server
const server = new ftpd.FtpSrv({
	// Bind to all interfaces
	url: bind,
	anonymous: false,
	tls,

	// Passive port range
	pasv_url: bind,
	pasv_min: parseInt(process.env.FTP_PASV_MIN || '65510'),
	pasv_max: parseInt(process.env.FTP_PASV_MIN || '65515'),

	// Greeting message
	greeting: [' ', 'Glass', 'Welcome to Glass FTP Server', 'This feature is still in development, so expect a few bugs.', ' ']
});

server.on('login', async ({ connection, username: id, password }, resolve, reject: any) => {
	// Get FTP connection details
	const ftpDetails = await FTPModel.findOne({ identifier: id });
	if (!ftpDetails) {
		await connection.reply(404, '[Glass] Invalid username or password');
		return reject('Invalid username or password');
	}

	// Check if password is correct
	if (decrypt(ftpDetails.password) !== password) {
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
