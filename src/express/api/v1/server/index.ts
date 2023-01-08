import { Request, Router } from 'express';
export const router = Router();

import { AuthenticatedRequest, loggedIn, requiresPermission } from '../../../middleware/authentication';
import { randomBytes } from 'crypto';
import { hasPermission, ServerPermission } from '../../../../authentication/permissions';
import { User } from '../../../../data/models/user';
import { onlineServers } from '../../../../socket';
import { ServerModel } from '../../../../data/models/server';
import { ClientMinecraftServer, toClientServer } from '../../../../minecraft/server';
import { v4 } from 'uuid';

import { router as filesRouter } from './files';
router.use('/:server/file', filesRouter);

router.get('/:server', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(auth.discord.id);

	const server: ClientMinecraftServer | undefined = accessible.find((s) => s._id === req.params.server.toLowerCase());
	if (!server) return res.status(403).json({ error: true, message: 'You do not have permission to do that.' });

	res.json({
		error: false,
		message: '',
		server: {
			...server,
			role: server.owner == auth.discord.id ? 'Owner' : 'Member',
			token: hasPermission(server, ServerPermission.MANAGE_SERVER) ? server.token : undefined,
			ftp: hasPermission(server, ServerPermission.MANAGE_SERVER) ? server.ftp : undefined
		}
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
				status: onlineServers.has(s._id) ? 'online' : 'offline'
			};
		})
	});
});

router.post('/:server', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const servers = await ServerModel.find({
		owner: auth.discord.id
	});

	// Enforce max server count
	if (servers.length >= 5)
		return res.status(403).json({
			error: true,
			message: 'You have reached the maximum number of servers.'
		});

	// Create server
	const server = await ServerModel.create({
		_id: v4(),
		token: randomBytes(32).toString('hex'),
		name: req.params.server,
		owner: auth.discord.id,
		setup: true,
		createdAt: Date.now()
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
	const authed = <AuthenticatedRequest>req;
	const deleted = await ServerModel.findByIdAndDelete(authed.params.server);

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
	const authed = <AuthenticatedRequest>req;
	const updated = await ServerModel.findByIdAndUpdate(authed.params.server, {
		token: randomBytes(32).toString('hex')
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
		token: updated.token
	});
});
