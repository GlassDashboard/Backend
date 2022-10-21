import { FileData } from 'src/ftp/utils';
import { Readable, Writable } from 'stream';
import { AuthSocket } from './authentication';
import { io } from './index';
import uuid from 'uuid';

export async function getFileData(server: AuthSocket, path: string, root: boolean = false): Promise<FileData | null> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('FETCH_FILE', JSON.stringify({ path, root }), (err, file) => {
			if (err) return resolve(null);

			const data = safeParse(file);
			if (!data || !data.name || !data.directory || !data.size)
				// Fake or Malformed data
				return resolve(null);

			resolve(data as FileData);
		});
	});
}

export function readFile(server: AuthSocket, path: string, root: boolean = false): Readable {
	const stream = new Readable();
	stream._read = () => {};

	let room;

	server.timeout(5000).emit('DOWNLOAD_FILE', JSON.stringify({ path, root }), (err, id) => {
		if (err) {
			console.log(err);
			return stream.push(null); // End stream
		}

		// prefixed so people can't fake the id and listen to other server data
		room = `download-${id}`;
		server.join(room);
	});

	server.on('EOF', (id) => {
		if (room != `download-${id}`) return;
		stream.push(null);
		server.leave(`download-${id}`);
	});

	server.on('BUFFER', (id, buffer) => {
		if (room != `download-${id}`) return;
		stream.push(buffer);
	});

	return stream;
}

export function uploadFile(server: AuthSocket, path: string, root: boolean = false): Writable {
	// Notify server of write stream to prepare the file
	const id = uuid.v4().replace(/-/g, '');
	server.emit('UPLOAD_FILE', JSON.stringify({ path, root }), id);

	// Create Writable Stream
	return new Writable({
		write(chunk, encoding, callback) {
			server.emit('BUFFER', id, chunk);
			callback();
		},

		writev(chunks, callback) {
			chunks.array.forEach((element) => {
				this.write(element, null, () => {});
			});
			callback();
		},

		final(callback) {
			server.emit('EOF', id);
		}
	});
}

export function deleteFile(server: AuthSocket, path: string, root: boolean = false): Promise<undefined> {
	return new Promise((resolve, _) => {
		server.timeout(5000).emit('DELETE_FILE', JSON.stringify({ path, root }), (_, _) => {
			resolve(undefined);
		});
	});
}

export function createDirectory(server: AuthSocket, path: string, root: boolean = false): Promise<string> {
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
	return new Promise((_, _) => {
		server.timeout(5000).emit('MOVE_FILE', JSON.stringify({ from, root }), JSON.stringify({ to, root }), (_, _) => {
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
