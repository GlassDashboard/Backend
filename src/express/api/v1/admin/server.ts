import { ServerModel } from '../../../../data/models/server';

import { Router } from 'express';
export const router = Router();

router.get('/:server', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	return res.json({
		error: false,
		message: '',
		server: data.toJson()
	});
});

router.delete('/:server', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	await data.delete();

	return res.json({
		error: false,
		message: 'Server deleted.'
	});
});

router.post('/:server/suspend', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	const reason = req.body['reason'] || 'No reason provided';

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	data.suspended = reason;
	await data.save();

	return res.json({
		error: false,
		message: 'Server suspended.'
	});
});

router.post('/:server/unsuspend', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	data.suspended = undefined;
	await data.save();

	return res.json({
		error: false,
		message: 'Server unsuspended.'
	});
});

router.post('/:server/verify', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	data.setup = undefined;
	await data.save();

	return res.json({
		error: false,
		message: 'Server verified.'
	});
});

router.post('/:server/unverify', async (req, res) => {
	const server = req.params.server;
	const data = await ServerModel.findById(server);

	if (data == null) return res.status(404).json({ error: true, message: 'Server not found.' });

	data.setup = true;
	await data.save();

	return res.json({
		error: false,
		message: 'Server unverified.'
	});
});
