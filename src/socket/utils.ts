import { FileData } from 'src/ftp/utils';
import { Readable, Writable } from 'stream';
import { AuthSocket } from './authentication';
import { v4 as uuidv4 } from 'uuid';

export async function getAllFiles(server: AuthSocket, path: string, root: boolean = false): Promise<FileData[] | null> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('ALL_FILES', JSON.stringify({ path, root }), (err, file) => {
			if (err) return resolve(null);

			const data = safeParse(file);
			if (!data || !Array.isArray(data))
				// Fake or Malformed data
				return resolve(null);

			resolve(data as FileData[]);
		});
	});
}

export async function getFileData(server: AuthSocket, path: string, root: boolean = false): Promise<FileData | null> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_FILE', JSON.stringify({ path, root }), (err, file) => {
			if (err) return resolve(null);

			let data = safeParse(file);
			if (path == '/' && root) data.name = '/';

			if (!data || !data.name || data.directory == undefined || data.size == undefined)
				// Fake or Malformed data
				return resolve(null);

			resolve(data as FileData);
		});
	});
}

export async function readFile(server: AuthSocket, path: string, root: boolean = false, receiver: AuthSocket | null = null): Promise<[Readable, Number]> {
	return new Promise((resolve, _) => {
		const stream = new Readable();
		stream._read = () => {};

		const socket = receiver || server;
		let room;
		let size = 0; // Size of downloaded file

		server.timeout(5000).emit('DOWNLOAD_FILE', JSON.stringify({ path, root }), (err, id, actualSize) => {
			if (err) return stream.push(null); // End stream
			size = actualSize;

			// Prefixed so people can't fake the id and listen to other server data
			// This is only needed here as this api is considered a 'trusted' source
			room = `download-${id}`;
			socket.join(room);

			const bufferHandler = (buffer) => {
				stream.push(buffer);
			};

			socket.once(`EOF-${room}`, () => {
				stream.push(null);
				server.leave(room);
				server.off(`BUFFER-${room}`, bufferHandler);
			});

			socket.on(`BUFFER-${room}`, bufferHandler);

			resolve([stream, size]);
		});
	});
}

export function createFile(server: AuthSocket, path: string, root: boolean = false) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('CREATE_FILE', JSON.stringify({ path, root }), () => {
			resolve(undefined);
		});
	});
}

function handleJson(text: any): any | null {
	if (typeof text == 'string') {
		try {
			return JSON.parse(text);
		} catch (e) {
			return null;
		}
	} else return null;
}

export function getOnlinePlayers(server: AuthSocket) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_PLAYERS', (err, players) => {
			if (err) resolve(null);
			resolve(handleJson(players));
		});
	});
}

export function getWhitelistedPlayers(server: AuthSocket) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_WHITELISTED_PLAYERS', (err, players) => {
			if (err) resolve(null);
			resolve(handleJson(players));
		});
	});
}

export function getOppedPlayers(server: AuthSocket) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_ADMINISTRATOR_PLAYERS', (err, players) => {
			if (err) resolve(null);
			resolve(handleJson(players));
		});
	});
}

export function getBlacklist(server: AuthSocket) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_BLACKLIST', (err, players) => {
			if (err) resolve(null);
			resolve(handleJson(players));
		});
	});
}

export function kickPlayer(server: AuthSocket, uuid: string, reason: string | null) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('KICK_PLAYER', uuid, reason, (err, success) => {
			if (err) resolve(null);
			resolve(success);
		});
	});
}

export function banPlayer(server: AuthSocket, uuid: string, reason: string | null) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('BAN_PLAYER', uuid, reason, (err, success) => {
			if (err) resolve(null);
			resolve(success);
		});
	});
}

export function pardonPlayer(server: AuthSocket, uuid: string) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('PARDON_PLAYER', uuid, (err, success) => {
			if (err) resolve(null);
			resolve(success);
		});
	});
}

export function setWhitelisted(server: AuthSocket, uuid: string, whitelisted: boolean) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('SET_WHITELIST', uuid, whitelisted, (err, success) => {
			if (err) resolve(null);
			resolve(success);
		});
	});
}

export function setAdministrator(server: AuthSocket, uuid: string, opped: boolean) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('SET_ADMINISTRATOR', uuid, opped, (err, success) => {
			if (err) resolve(null);
			resolve(success);
		});
	});
}

export function unarchiveFile(server: AuthSocket, path: string, root: boolean = false) {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('UNARCHIVE_FILE', JSON.stringify({ path, root }), () => {
			resolve(undefined);
		});
	});
}

export function writeFile(server: AuthSocket, path: string, root: boolean = false): UploadStream {
	// Notify server of write stream to prepare the file
	const id = uuidv4().replace(/-/g, '');
	server.emit('UPLOAD_FILE', JSON.stringify({ path, root }), id);

	const stream = new UploadStream(server, id);
	server.uploads.push(stream);

	return stream;
}

export function deleteFile(server: AuthSocket, path: string, root: boolean = false): Promise<undefined> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('DELETE_FILE', JSON.stringify({ path, root }), () => {
			resolve(undefined);
		});
	});
}

export function createDirectory(server: AuthSocket, path: string, root: boolean = false): Promise<string | undefined> {
	// We return the top level directory when we create the directory, this is
	// so we can recursively create directories, example: MKDIR /test1/test2/test3/

	return new Promise((resolve, _) => {
		server.timeout(5000).emit('CREATE_FOLDER', JSON.stringify({ path, root }), (err, directory) => {
			if (err) resolve(undefined);
			else resolve(directory);
		});
	});
}

export function moveFile(server: AuthSocket, from: string, to: string, root: boolean = false): Promise<undefined> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('MOVE_FILE', JSON.stringify({ path: from, root }), JSON.stringify({ path: to, root }), () => {
			resolve(undefined);
		});
	});
}

export function copyFile(server: AuthSocket, from: string, to: string, root: boolean = false): Promise<undefined> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('COPY_FILE', JSON.stringify({ path: from, root }), JSON.stringify({ path: to, root }), () => {
			resolve(undefined);
		});
	});
}

export function safeParse(json: string): any | null {
	try {
		return JSON.parse(json);
	} catch (_) {
		return null;
	}
}

export class UploadStream extends Writable {
	socket: AuthSocket;
	id: string;

	sentBytes: number = 0;
	limit: number = 10000000; // 10MB / sec (real world speeds might be faster)

	constructor(socket, id, options = {}) {
		super(options);
		this.socket = socket;
		this.id = id;
	}

	async _write(chunk, encoding, callback) {
		this.sentBytes += chunk.length;
		this.socket.emit(`BUFFER-${this.id}`, Uint8Array.from(chunk));

		// I'm sorry for this mess
		if (this.sentBytes >= this.limit / 40) {
			return new Promise((resolve, _) => {
				setTimeout(() => {
					this.sentBytes -= this.limit;
					callback();
				}, 500);
			});
		} else {
			callback();
		}
	}

	_writev(chunks, callback) {
		chunks.forEach((element: Buffer | Uint8Array) => {
			this._write(element, 'binary', () => {});
		});
		callback();
	}

	_final() {
		// When bulk uploading, we sometimes have an issue with closing the socket too early,
		// so we will give them an addition 2s to finish up before expiring the stream.
		setTimeout(() => {
			// Close the stream
			this.socket.emit(`EOF-${this.id}`);
			this.emit('finish');

			// Expire ID
			this.socket.uploads = this.socket.uploads.filter((u) => u != this);
		}, 2000);
	}
}
