import { Request, Router } from 'express';
export const router = Router();

import { AuthenticatedRequest, loggedIn, requiresPermission } from '../../../middleware/authentication';
import { randomBytes } from 'crypto';
import { hasPermission, ServerPermission } from '../../../../authentication/permissions';
import { User } from '../../../../data/models/user';
import { onlineServers } from '../../../../socket';
import { ServerModel } from '../../../../data/models/server';
import { FTP, FTPModel } from '../../../../data/models/ftp';
import { ClientMinecraftServer, toClientServer, NAME_REGEX } from '../../../../minecraft/server';
import { v4 } from 'uuid';

import { router as filesRouter } from './files';
router.use('/:server/file', filesRouter);

import { router as subusersRouter } from './subusers';
import { encrypt, hash } from '../../../../authentication/encryption';
router.use('/:server/subusers', requiresPermission(ServerPermission.MANAGE_SUBUSERS), subusersRouter);

router.get('/:server', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(auth.discord.id);

	const byName: boolean = req.query.hasOwnProperty('byName');
	const byHash: boolean = req.query.hasOwnProperty('byHash');

	const server: ClientMinecraftServer | undefined = accessible.find((s) => {
		if (byName) return s.name.toLowerCase() === req.params.server.toLowerCase();
		else if (byHash) return s._id.split('-')[0] === req.params.server;
		else return s._id.toLowerCase() === req.params.server.toLowerCase();
	});

	if (!server) return res.status(403).json({ error: true, message: 'You do not have permission to do that.' });

	res.json({
		error: false,
		message: '',
		server: {
			...server,
			status: onlineServers.has(server._id) ? 'Online' : 'Offline',
			role: server.owner == auth.discord.id ? 'Owner' : 'Member',
			token: hasPermission(server, ServerPermission.MANAGE_SERVER) ? server.token : undefined
		}
	});
});

router.get('/:server/ftp', requiresPermission(ServerPermission.FTP_ACCESS), async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(auth.discord.id);
	const server: ClientMinecraftServer | undefined = accessible.find((s) => s._id.toLowerCase() === req.params.server.toLowerCase());

	if (!server) return res.status(403).json({ error: true, message: 'You do not have permission to do that.' });

	let ftp: any = await FTPModel.findOne({ server: server._id, assignee: auth.discord.id });
	if (!ftp) ftp = await FTP.create(auth.discord.id, server._id);

	res.json({
		error: false,
		message: '',
		ftp: { ...ftp.toJson(), __v: undefined }
	});
});

router.post('/:server/ftp/reset', requiresPermission(ServerPermission.FTP_ACCESS), async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(auth.discord.id);
	const server: ClientMinecraftServer | undefined = accessible.find((s) => s._id.toLowerCase() === req.params.server.toLowerCase());

	if (!server) return res.status(403).json({ error: true, message: 'You do not have permission to do that.' });

	let ftp: any = await FTPModel.findOne({ server: server._id, assignee: auth.discord.id });
	if (!ftp) ftp = await FTP.create(auth.discord.id, server._id);
	else {
		const password = randomBytes(16).toString('hex');
		ftp.salt = randomBytes(16).toString('hex');
		ftp.password = encrypt(password, ftp.salt);
	}

	await ftp.save();

	res.json({
		error: false,
		message: '',
		ftp: { ...ftp.toJson(), __v: undefined }
	});
});

router.get('/', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(auth.discord.id);

	res.json({
		error: false,
		message: '',
		servers: accessible.map((s: ClientMinecraftServer) => {
			return {
				...s,
				token: hasPermission(s, ServerPermission.MANAGE_SERVER) ? s.token : undefined,
				role: s.owner == auth.discord.id ? 'Owner' : 'Member',
				status: onlineServers.has(s._id) ? 'Online' : 'Offline'
			};
		})
	});
});

router.post('/:server', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const servers = await ServerModel.find({
		owner: auth.discord.id
	});

	// Check if user has a valid invite
	const user: User = await auth.discord.getUser();
	if (!user.invite)
		return res.status(403).json({
			error: true,
			message: 'You are not permitted to do this!'
		});

	// Enforce max server count
	if (servers.length >= 5)
		return res.status(403).json({
			error: true,
			message: 'You have reached the maximum number of servers.'
		});

	// Enforce server name length
	if (!NAME_REGEX.test(req.params.server.toString()))
		return res.status(400).json({
			error: true,
			message: 'The server name must be A-Z0-9, and between 3 and 16 characters. Spaces, dashes, and underscores are permitted.'
		});

	// Enforce server name uniqueness (case insensitive)
	if (servers.find((s) => s.name.toLowerCase() === req.params.server.toLowerCase()))
		return res.status(400).json({
			error: true,
			message: 'You already have a server with that name.'
		});

	// Create server
	const server = await ServerModel.create({
		_id: v4(),
		token: randomBytes(32).toString('hex'),
		name: req.params.server,
		owner: auth.discord.id,
		setup: true,
		createdAt: Math.floor(Date.now() / 1000)
	});

	await server.save();

	// Respond
	res.json({
		error: false,
		message: 'Created server.',
		server: toClientServer(server.toJson(), auth.discord.id)
	});
});

router.delete('/:server', requiresPermission(ServerPermission.MANAGE_SERVER), async (req: Request, res) => {
	const deleted = await ServerModel.findByIdAndDelete(req.params.server);

	if (!deleted)
		return res.status(403).json({
			error: true,
			message: 'An internal error has occurred',
			code: 1
		});

	res.json({
		error: false,
		message: 'Deleted server.'
	});
});

router.post('/:server/reset_token', requiresPermission(ServerPermission.MANAGE_SERVER), async (req: Request, res) => {
	const newToken = randomBytes(32).toString('hex');

	const updated = await ServerModel.findByIdAndUpdate(req.params.server, {
		token: newToken
	});

	if (!updated)
		return res.status(403).json({
			error: true,
			message: 'Failed to update on database. Please report this to a developer!',
			code: 2
		});

	res.json({
		error: false,
		message: 'Reset server token.',
		token: newToken
	});
});
