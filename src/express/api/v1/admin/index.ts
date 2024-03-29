import { Router } from 'express';
import { onlineServers } from '../../../../socket';
import { InviteModel } from '../../../../data/models/invite';
import { ServerModel } from '../../../../data/models/server';
import { UserModel } from '../../../../data/models/user';
export const router = Router();

import { router as inviteRouter } from './invite';
router.use('/invite', inviteRouter);

import { router as userRouter } from './user';
router.use('/user', userRouter);

import { router as statsRouter } from './stats';
router.use('/stats', statsRouter);

router.get('/users', async (req, res) => {
	const users = await UserModel.find({}).sort({ createdAt: -1 });
	res.json({
		error: false,
		message: '',
		users: users.map((u) => u.toJson())
	});
});

router.get('/servers', async (req, res) => {
	const servers = await ServerModel.find({}).sort({ createdAt: -1 });
	res.json({
		error: false,
		message: '',
		servers: servers
			.map((u) => u.toJson())
			.map((s) => {
				return {
					...s,
					status: onlineServers.has(s._id) ? 'Online' : 'Offline',
					role: 'Administator'
				};
			})
	});
});

router.get('/invites', async (req, res) => {
	const invites = await InviteModel.find({}).sort({ createdAt: -1 });
	res.json({
		error: false,
		message: '',
		invites: invites.map((u) => u.toJson())
	});
});
