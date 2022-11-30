import { Router } from 'express';
import { UserModel } from '../../../../data/models/user';
import { ServerModel } from '../../../../data/models/server';
import { getCached, setCached } from '../../../middleware/cache';
export const router = Router();

router.get('/', async (req, res) => {
	const cache = getCached('stats');
	if (cache != null) return res.json(cache);

	const users = await UserModel.countDocuments();
	const servers = await ServerModel.countDocuments();

	res.json(
		setCached('stats', {
			error: false,
			message: '',
			users,
			servers
		})
	);
});
