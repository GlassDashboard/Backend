import { UserModel } from 'src/data/models/user';
import { ServerModel } from 'src/data/models/server';
import { InviteModel } from 'src/data/models/invite';

import { Router } from 'express';
export const router = Router();

router.get('/:user', async (req, res) => {
	const user = req.params.user;
	const data = await UserModel.findById(user);

	if (data == null) return res.status(404).json({ error: true, message: 'User not found.' });

	const servers = await ServerModel.find({
		$or: [
			{
				owner: data._id
			},
			{
				users: {
					$in: [data._id]
				}
			}
		]
	});

	const invites = await InviteModel.find({
		inviter: data._id
	});

	const usersInvited = await InviteModel.countDocuments({
		inviter: data._id
	});

	return res.json({
		error: false,
		message: '',
		user: data.toJson(),
		servers: servers.map((s) => s.toJson()),
		invites: invites.map((i) => i.toJson()),
		invited: usersInvited
	});
});

router.post('/:user/suspend', async (req, res) => {
	const user = req.params.user;
	const data = await UserModel.findById(user);

	const reason = req.body['reason'] || 'No reason provided';

	if (data == null) return res.status(404).json({ error: true, message: 'User not found.' });

	data.suspended = reason;
	await data.save();

	return res.json({
		error: false,
		message: 'User suspended.'
	});
});

router.post('/:user/unsuspend', async (req, res) => {
	const user = req.params.user;
	const data = await UserModel.findById(user);

	if (data == null) return res.status(404).json({ error: true, message: 'User not found.' });

	data.suspended = undefined;
	await data.save();

	return res.json({
		error: false,
		message: 'User unsuspended.'
	});
});

router.delete('/:user', async (req, res) => {
	const user = req.params.user;
	const data = await UserModel.findById(user);

	if (data == null) return res.status(404).json({ error: true, message: 'User not found.' });

	await data.delete();

	return res.json({
		error: false,
		message: 'User deleted.'
	});
});

router.post('/:user/invalidate_invites', async (req, res) => {
	const user = req.params.user;
	const data = await UserModel.findById(user);

	if (data == null) return res.status(404).json({ error: true, message: 'User not found.' });

	await InviteModel.deleteMany({
		inviter: data._id
	});

	return res.json({
		error: false,
		message: 'User invites invalidated.'
	});
});
