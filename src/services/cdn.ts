// A basic service for allowing users to fetch files directly from the server.
import { randomBytes } from 'crypto';
import { Request } from 'express';
import * as fsSync from 'fs';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import ms from 'ms';
import { ID, createId } from '~/wrapper/typeid';

const CDN_DIR = path.join(__dirname, '..', '..', 'cdn');

export type CDNMetadata = {
	/**
	 * The token for the actual file, this will ensure that they have access to the file.
	 */
	access_token: string;

	/**
	 * The id of the file.
	 */
	id: ID<'cdn'>;

	/**
	 * The original name of the file
	 */
	name: string;

	/**
	 * The time the file was created.
	 */
	created_at: number;

	/**
	 * How long until the file should be deleted from the CDN.
	 */
	ttl: number;

	/**
	 * The absolute path to the file.
	 */
	path: string;
};

export const initialize = async () => {
	const exists = fsSync.existsSync(CDN_DIR);
	if (!exists) fsSync.mkdirSync(CDN_DIR);

	// Reschedule all existing files
	const files = await getAllFiles();
	for (const file of files) {
		const data = await getMetaData(file);
		if (data.created_at + data.ttl < Date.now()) {
			deleteFile(file);
			continue;
		}

		setTimeout(() => {
			deleteFile(file);
		}, data.created_at + data.ttl - Date.now());
	}
};

const generateMetadata = (name: string, ttl: number): CDNMetadata => {
	const id = createId('cdn');

	return {
		access_token: randomBytes(32).toString('hex'),
		created_at: Date.now(),
		path: path.join(CDN_DIR, id.toString(), 'file'),
		id,
		name,
		ttl
	};
};

export const getAllFiles = async (): Promise<ID<'cdn'>[]> => {
	return (await fs.readdir(CDN_DIR)).map((id) => ID.fromString<'cdn'>(id)!);
};

const getMetaData = async (id: ID<'cdn'>): Promise<CDNMetadata> => {
	const metadataPath = path.join(CDN_DIR, id.toString(), 'metadata.json');
	const file = await fs.readFile(metadataPath, 'utf-8');
	const data = JSON.parse(file) as CDNMetadata;

	return data;
};

export const findFile = async (id: ID<'cdn'>, token: string): Promise<CDNMetadata> => {
	const cdn = await fs.readdir(CDN_DIR);
	if (!cdn.includes(id.toString())) throw new Error('File not found');

	// Check if the token is valid
	const data = await getMetaData(id);
	if (data.access_token != token) throw new Error('Invalid access token');
	if (data.created_at + data.ttl < Date.now()) throw new Error('File has expired');

	return data;
};

export const deleteFile = async (id: ID<'cdn'>) => {
	const cdn = await fs.readdir(CDN_DIR);
	if (!cdn.includes(id.toString())) return;
	try {
		await fs.rm(path.join(CDN_DIR, id.toString()), { recursive: true });
	} catch (e) {
		// Should only happen if we delete the file manually
		console.error(e);
	}
};

export const store = async (file: Express.Multer.File, ttl: number): Promise<CDNMetadata> => {
	const metadata = generateMetadata(file.originalname, ttl);
	const dir = path.join(CDN_DIR, metadata.id.toString());

	const exists = fsSync.existsSync(dir);
	if (exists) return store(file, ttl);

	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata));

	// Run TTL
	setTimeout(() => {
		deleteFile(metadata.id);
	}, ttl);

	return metadata;
};

export const getRoot = () => CDN_DIR;

export const settings: multer.Options = {
	storage: multer.diskStorage({
		destination: async (
			_req: Request,
			file: Express.Multer.File,
			cb: (err: Error | null, name: string) => void
		) => {
			const metadata = await store(file, ms('10 minutes'));
			const request = _req as CDNRequest;

			if (!request.cdn) request.cdn = [];
			request.cdn.push(metadata);

			cb(null, path.resolve(metadata.path, '..'));
		},
		filename: (
			_req: Request,
			_file: Express.Multer.File,
			cb: (err: Error | null, name: string) => void
		) => {
			cb(null, 'file');
		}
	}),
	limits: {
		fieldNameSize: 255,
		fileSize: parseInt(process.env.FILE_SIZE_LIMIT || '100') * 1024 * 1024
	}
};

export interface CDNRequest extends Request {
	cdn: CDNMetadata[] | undefined;
}
