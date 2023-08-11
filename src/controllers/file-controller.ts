import {
	Authorized,
	Body,
	CurrentUser,
	Delete,
	Get,
	HttpError,
	JsonController,
	Patch,
	Post,
	Put,
	QueryParam
} from 'routing-controllers';
import { User } from '@clerk/clerk-sdk-node';
import { Server, UserServer } from '~/decorators/server';
import { FilePath } from '~/decorators/path';
import { ServerPermission } from '~/authentication/permissions';

interface FileData {
	/**
	 * The new path of the file.
	 */
	path: string | null;

	/**
	 * If the file should be copied instead of moved.
	 */
	copy: boolean | null;

	/**
	 * The new content of the file.
	 */
	content: string | null;

	/**
	 * Should the file attempt to be unarchived.
	 */
	unarchive: boolean | null;
}

@Authorized()
@JsonController('/server/:server/file')
@JsonController('/server/:server/file/*')
export class FileController {
	@Get('/')
	async getFileInfo(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.READ_FILES] }) server: UserServer,
		@FilePath() path: string
	) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('file:metadata', path, (err: Error, metadata) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(metadata);
			});
		});
	}

	@Post('/')
	async createFile(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.WRITE_FILES] }) server: UserServer,
		@FilePath() path: string,
		@QueryParam('type', { required: false }) type: 'file' | 'directory' = 'file'
	) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('file:create', path, type, (err: Error) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(null);
			});
		});
	}

	@Delete('/')
	async deleteFile(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.WRITE_FILES] }) server: UserServer,
		@FilePath() path: string
	) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('file:delete', path, (err: Error) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(null);
			});
		});
	}

	@Patch('/')
	async writeFile(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.WRITE_FILES] }) server: UserServer,
		@FilePath() path: string,
		@Body() body: string
	) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('file:write', path, body, (err: Error) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(null);
			});
		});
	}

	@Put('/')
	async changeFile(
		@CurrentUser() user: User,
		@Server({ permissions: [ServerPermission.WRITE_FILES] }) server: UserServer,
		@FilePath() path: string,
		@Body() data: FileData
	) {
		const socket = server.getAsUser(user).getSocket();
		if (!socket) throw new HttpError(500, 'Server socket not found.');

		return new Promise((resolve, _) => {
			socket.timeout(5000).emit('file:change', path, data, (err: Error) => {
				if (err) return resolve(new HttpError(500, err.message));
				resolve(null);
			});
		});
	}
}
