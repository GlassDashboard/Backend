import { Request, Router } from 'express';
export const router = Router();

import { AuthenticatedRequest, loggedIn } from '../../../middleware/authentication';
import fetch from 'node-fetch';
import { randomBytes } from 'crypto';
import { ServerPermission } from 'src/authentication/permissions';
import { onlineServers } from 'src/socket';
import { ServerModel } from 'src/data/models/server';
import { User } from 'src/data/models/user';

router.get('/:server', loggedIn, async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const accessable = await User.getAssociatedServers(auth.discord.id);

	const server = accessable.find((s) => s._id === req.params.server.toLowerCase());
	if (!server) return res.status(403).json({ error: true, message: 'You do not have permission to do that.' });

	res.json({
		error: false,
		message: '',
		server: {
			...server.toJson(),
			role: server.owner == auth.discord.id ? 'Owner' : 'Member',
			permissions: server.getPermissions(auth.discord.id),
			token: server.hasPermission(auth.discord.id, ServerPermission.MANAGE_SERVER) ? server.token : undefined
		}
	});
});

router.get('/', loggedIn, async (req: Request, res) => {
    const auth = req as AuthenticatedRequest;
    const accessable = await User.getAssociatedServers(auth.discord.id);

	res.json({
		error: false,
		message: '',
		servers: accessable.map((s) => {
			return {
				...s.toJson(),
				role: s.owner == auth.discord.id ? 'Owner' : 'Member',
				permissions: s.getPermissions(auth.discord.id),
				token: s.hasPermission(auth.discord.id, ServerPermission.MANAGE_SERVER) ? s.token : undefined,
				status: onlineServers.includes(s._id) ? 'online' : 'offline'
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
	if (servers.length >= 5) return res.status(403).json({ error: true, message: 'You have reached the maximum number of servers.' });

	// Ensure server name is unique
	const existing = await ServerModel.findById(req.params.server.toLowerCase().replace(' ', ''));
	if (existing) return res.status(403).json({ error: true, message: 'A server with that name already exists.' });

	// Contact Minehut API to fix server casing
	const minehut = await fetch(`https://api.minehut.com/server/${req.params.server}?byName=true`).then((res) => res.json());

	if (minehut.error || minehut.ok == false) return res.status(403).json({ error: true, message: 'The server name you entered is invalid.' });

	// Ensure server is not a proxy
	if (minehut.server.proxy) return res.status(403).json({ error: true, message: 'We do not currently support proxies!' });

	// Create server
	const server = await ServerModel.create({
		_id: req.params.server.toLowerCase().replace(' ', ''),
		token: randomBytes(32).toString('hex'),
		ftpPassword: randomBytes(16).toString('hex'),
		name: minehut.server.name,
		owner: auth.discord.id,
		apiOwner: minehut.server.owner,
		apiID: minehut.server._id,
		setup: true,
		createdAt: Date.now()
	});

	await server.save();

	// Respond
	res.json({
		error: false,
		message: 'Created server.',
		server
	});
});

router.delete('/:server', requiresPermission(ServerPermission.MANAGE_SERVER), async (req: Request, res) => {
	const server = req as ServerRequest;
	const deleted = await ServerModel.findByIdAndDelete(server.params.server);

	if (!deleted) return res.status(403).json({ error: true, message: 'An internal error has occurred', code: 1 });

	res.json({
		error: false,
		message: 'Deleted server.'
	});
});

router.post('/:server/reset_token', requiresPermission(ServerPermission.MANAGE_SERVER), async (req: Request, res) => {
	const server = req as ServerRequest;
	const updated = await ServerModel.findByIdAndUpdate(server.params.server, {
		token: randomBytes(32).toString('hex')
	});

	if (!updated) return res.status(403).json({ error: true, message: 'Failed to update on database. Please report this to a developer!', code: 2 });

	res.json({
		error: false,
		message: 'Reset server token.',
		token: updated.token
	});
});
