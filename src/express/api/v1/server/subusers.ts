import { Request, Router } from 'express';
import { DEFAULT_PERMISSIONS } from '../../../../authentication/permissions';
import { ServerModel } from '../../../../data/models/server';
import { UserModel } from '../../../../data/models/user';
import { AuthenticatedRequest } from '../../../middleware/authentication';
export const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const server = await ServerModel.findOne({ _id: auth.params.server });

	if (server == null || !server.getPermissions(auth.discord.id))
		return res.status(403).json({
			error: true,
			message: 'You do not have permission to do that.'
		});

	const users: any[] = await server.getSubusers();

	// Respond
	res.json({
		error: false,
		message: '',
		subusers: users.map((user) => {
			return {
				_id: user._id,
				tag: user.tag,
				avatar: `https://cdn.discordapp.com/avatars/${user._id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}`,
				admin: user.admin || false,
				permissions: user.permissions, // TODO: fix this
				role: user.role
			};
		})
	});
});

router.post('/', async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const server = await ServerModel.findOne({ _id: auth.params.server });

	if (server == null || !server.getPermissions(auth.discord.id))
		return res.status(403).json({
			error: true,
			message: 'You do not have permission to do that.'
		});

	if (!auth.body || !auth.body.user)
		return res.status(400).json({
			error: true,
			message: 'You did not specify a user to add.'
		});

	const user = await UserModel.findOne({ $or: [{ _id: auth.body.user }, { tag: auth.body.user }] });
	if (user == null)
		return res.status(404).json({
			error: true,
			message: 'That user does not have an account on Glass.'
		});

	if (user._id == server.owner)
		return res.status(403).json({
			error: true,
			message: 'You are not permitted to alter permissions of the owner.'
		});

	let permissions = auth.body.permissions && auth.body.permissions >= 0 ? auth.body.permissions : DEFAULT_PERMISSIONS;

	// Remove any existing permissions
	server.users = server.users.filter((u) => u._id != user._id);

	// Push new permissions
	server.users.push({
		_id: user._id,
		permissions: permissions.toString()
	});

	await server.save();

	res.json({
		error: false,
		message: 'Successfully added user as subuser',
		user: {
			_id: user._id,
			tag: user.tag,
			avatar: user.getAvatarURL(),
			admin: user.admin || false,
			permissions
		}
	});
});

router.delete('/', async (req: Request, res) => {
	const auth = req as AuthenticatedRequest;
	const server = await ServerModel.findOne({ _id: auth.params.server });

	if (server == null || !server.getPermissions(auth.discord.id))
		return res.status(403).json({
			error: true,
			message: 'You do not have permission to do that.'
		});

	if (!auth.body || !auth.body.user)
		return res.status(400).json({
			error: true,
			message: 'You did not specify a user to remove.'
		});

	const user = await UserModel.findOne({ _id: auth.body.user });
	if (user == null || !server.users.find((u) => u._id == user._id))
		return res.status(404).json({
			error: true,
			message: 'That user is not a subuser.'
		});

	if (user._id == server.owner)
		return res.status(403).json({
			error: true,
			message: 'You are not permitted to remove permissions of the owner.'
		});

	server.users = server.users.filter((u) => u._id != user._id);
	await server.save();

	res.json({
		error: false,
		message: 'Successfully removed user as subuser',
		user: {
			_id: user._id,
			tag: user.tag,
			avatar: user.getAvatarURL(),
			admin: user.admin || false
		}
	});
});
