import { Router } from 'express';
export const router = Router();
import { getPlugins, getDescription } from '../../../../plugin';

router.get('/search/:query?', async (req, res) => {
	// Handle additional data
	const search: string | undefined = req.params.query?.toString();
	let page: number;
	let size: number;
	const sort: string = (req.query.sort || '-downloads').toString();

	try {
		page = parseInt(req.query.page?.toString() || '1');
		size = parseInt(req.query.size?.toString() || '10');
	} catch (e) {
		return res.status(400).json({
			error: true,
			message: 'Invalid size or page number provided, enter a valid number instead.'
		});
	}

	const data = await getPlugins(search, size, page, sort);

	res.json({
		error: false,
		message: '',
		plugins: data.plugins,
		pages: data.pages
	});
});

router.get('/description/:id', async (req, res) => {
	const id = req.params.id;
	const description: string = (await getDescription(id)) || 'No description provided';

	res.json({
		error: false,
		message: '',
		description
	});
});
