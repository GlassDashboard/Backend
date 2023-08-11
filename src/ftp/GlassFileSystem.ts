import { AuthenticatedConnection } from './index';
import { FileSystem } from 'ftp-srv';
import { join } from 'path';
import {
	getFileData,
	readFile,
	writeFile,
	deleteFile,
	moveFile,
	createDirectory
} from '../socket/utils';
import { FileData, generateStat } from './utils';
import uuid from 'uuid';
import { Readable, Writable } from 'stream';
import { BLOCKED_FILES } from '../authentication/blocked';

export default class GlassFileSystem extends FileSystem {
	details: AuthenticatedConnection;

	cwd: string = '/';
	home: string = '/';

	constructor(connection: AuthenticatedConnection) {
		super(connection.connection, {
			root: '/' + connection.server.minecraft!.name,
			cwd: '/' + connection.server.minecraft!.name
		});

		this.details = connection;

		this.home = '/' + this.details.server.minecraft!.name;
		this.cwd = this.home;
	}

	_resolve(path: string): { server: string; named: string } {
		let location = this._resolvePath(path);

		BLOCKED_FILES.forEach((file) => {
			if (location.startsWith(file)) {
				location = '/';
				this.connection.reply(550, 'You are not permitted to access this file!');
			}
		});

		return {
			server: location,
			named: this._fixSeperator(join(this.home, location))
		};
	}

	//    Blocked File System Methods

	async chmod(path: string, mode: string): Promise<any> {
		await this.connection.reply(550, `[Glass] You are not permitted to do this!`);
	}

	//    Pathing

	getUniqueName(fileName: string): string {
		return uuid.v4().replace(/\W/g, '');
	}

	currentDirectory(): string {
		return this.cwd;
	}

	currentServerDirectory(): string {
		const directory = this._stripHome(this.currentDirectory());
		return directory.trim() == '' ? '/' : directory;
	}

	_fixSeperator(path: string): string {
		return path.replace(/\\/g, '/');
	}

	_stripHome(directory: string): string {
		return directory.startsWith(this.home) ? directory.substring(this.home.length) : directory;
	}

	_resolvePath(raw: string): string {
		let path = raw == '.' ? '/' : this._fixSeperator(raw);
		if (raw == '/') path = this.home; // Redirect / to the home directory
		const absolute = path.startsWith(this.home);

		if (!path.startsWith(this.currentServerDirectory()) && !absolute)
			path = this._fixSeperator(join('/', this.currentServerDirectory(), path, '/'));
		else if (absolute) path = path.substring(this.home.length);

		return path.endsWith('/') ? path.substring(0, path.length - 1) : path;
	}

	//    File System Methods
	// Navigation

	override async chdir(path: string): Promise<string> {
		const { named } = this._resolve(path);
		this.cwd = named;
		return named;
	}

	async get(path: string): Promise<any> {
		const { server } = this._resolve(path);

		const data = await getFileData(this.details.server, server);
		if (!data) return [];

		if (data.error) {
			await this.connection.reply(550, `[Glass] ${data.error}`);
			return new Error(data.error);
		}

		return generateStat(data);
	}

	override async list(path: string = '/'): Promise<any> {
		const { server } = this._resolve(path);

		const data = await getFileData(this.details.server, server);
		if (!data) return [];

		return (data.children || []).map((child: FileData) => {
			return generateStat(child);
		});
	}

	// Modifications

	override async read(file: string, extra): Promise<any> {
		const { server, named } = this._resolve(file);
		const data = await readFile(this.details.server, server);
		if (!data || !data[0]) {
			await this.connection.reply(550, `[Glass] Failed to get stream for this file!`);
			return new Error('File Stream failure');
		}

		const stream: Readable = data[0];
		// @ts-ignore
		stream.path = server;

		return {
			stream,
			clientPath: named
		};
	}

	override async write(file: string, extra): Promise<any> {
		const { server, named } = this._resolve(file);
		const stream: Writable = writeFile(this.details.server, server);
		stream.once('close', () => stream.end());

		return {
			stream,
			clientPath: named
		};
	}

	override async delete(path: string): Promise<undefined> {
		const { server } = this._resolve(path);

		await deleteFile(this.details.server, server, false);
		return undefined;
	}

	override async mkdir(path: string): Promise<undefined> {
		const { server } = this._resolve(path);

		await createDirectory(this.details.server, server);
		return undefined;
	}

	override async rename(from: string, to: string): Promise<undefined> {
		const { server: fromPath } = this._resolve(from);
		const { server: toPath } = this._resolve(to);

		await moveFile(this.details.server, fromPath, toPath);
		return undefined;
	}
}
