import * as ftpd from 'ftp-srv';
import { onlineServers } from '../socket';
import {FTPDetails} from "../data/models/server";
import {User, UserModel} from "../data/models/user";
import {FtpConnection} from "ftp-srv";
import GlassFileSystem from "./GlassFileSystem";
import {AuthSocket} from "../socket/authentication";

// Create ftp server
const server = new ftpd.FtpSrv({
    url: 'ftp://' + process.env.FTP_BIND + ':' + process.env.FTP_PORT,
    anonymous: false,
    greeting: [' ', 'Glass', 'Welcome to Glass FTP Server', 'This feature is still in development, so expect a few bugs.', ' ']
});

server.on('login', async ({ connection, username, password }, resolve, reject: any) => {
    // Ensure connection details are in the proper format
    const connectionDetails = username.split('.');
    if (connectionDetails.length != 2) {
        connection.reply(400, '[Glass] Invalid connection details, double check your username and password');
        return reject('Invalid connection details');
    }

    // Format the connection details
    const connectionInfo: FTPConnectionDetails = {
        server: connectionDetails[0],
        identifier: connectionDetails[1]
    }

    // Check if server is online
    const server: AuthSocket | undefined = onlineServers.get(connectionInfo.server)
    if (!server) {
        connection.reply(404, '[Glass] Server is not currently online or valid, try starting the server up and make sure it is connected properly');
        return reject('Server is not currently online');
    }

    // Try fetching ftp details from server
    const ftpDetails: FTPDetails | undefined = server.minecraft!.ftp.find((ftp) => {
        return ftp.identifier == connectionInfo.identifier && ftp.password == password;
    });

    // Check if password is correct
    if (!ftpDetails) return reject('Invalid username or password');

    // Fetch user from database
    const user: User | null = await UserModel.findById(ftpDetails.assignee);
    if (user == null) return reject('Invalid username or password');

    return resolve({ fs: new GlassFileSystem({server, user, connection}) });
});

// Identifies an incoming connection, server being the server id,
// identifier being a way to identify the user
interface FTPConnectionDetails {
    server: string,
    identifier: string,
}

// Represents a ftp's connection that was successfully established
export interface AuthenticatedConnection {
    server: AuthSocket,
    user: User,
    connection: FtpConnection
}

export function start() {
    server.listen().then(() => {
        console.log('FTP Server listening on port ' + process.env.FTP_PORT);
    });
}
