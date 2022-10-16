import { Router } from 'express';
import { UserModel } from 'src/data/models/user';
import { ServerModel } from 'src/data/models/server';
import { getCached, setCached } from '../../../middleware/cache';
export const router = Router();

router.get('/', async (req, res) => {
	const cache = getCached('stats');
	if (cache != null) return res.json(cache);

	const users = await UserModel.countDocuments();
	const servers = await ServerModel.countDocuments();

	const response = {
		error: false,
		message: '',
		users,
		servers
	};

	setCached('stats', response);
	res.json(response);
});
