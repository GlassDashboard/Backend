import { Request, Router } from 'express';
import { InviteModel } from '../../../../data/models/invite';
import { getServerDistribution, ServerModel } from '../../../../data/models/server';
import { UserModel } from '../../../../data/models/user';
import { getSocketDistribution } from '../../../../socket';
export const router = Router();

async function groupSum(field: string): Promise<number> {
	const data = await ServerModel.aggregate([
		{ $unwind: field },
		{
			$group: {
				_id: null,
				count: {
					$sum: 1
				}
			}
		}
	]);

	if (data.length == 0) return 0;
	return data[0].count;
}

async function getCounts(lookback?: number) {
	const query: any = {};
	if (lookback) query.createdAt = { $gt: Date.now() - lookback };

	return {
		users: await UserModel.countDocuments(query),
		servers: await ServerModel.countDocuments(query),
		invites: await InviteModel.countDocuments(query)
	};
}

router.get('/', async (req: Request, res) => {
	const connections = getSocketDistribution();

	const server = {
		subusers: await groupSum('$users'),
		ftp_accounts: await groupSum('$ftp'),
		distribution: await getServerDistribution()
	};

	res.json({
		error: false,
		message: '',
		stats: {
			timetable: {
				total: await getCounts(),
				today: await getCounts(1000 * 60 * 60 * 24),
				week: await getCounts(1000 * 60 * 60 * 24 * 7),
				month: await getCounts(1000 * 60 * 60 * 24 * 30)
			},
			connections,
			server
		}
	});
});
