import { Router } from 'express';
export const router = Router();

import { router as serverRouter } from './server';
router.use('/server', serverRouter);

import { router as discordRouter } from './discord';
router.use('/discord', discordRouter);

import { router as statsRouter } from './stats';
router.use('/stats', statsRouter);

import { router as inviteRouter } from './invite';
router.use('/invite', inviteRouter);

import { isAdmin } from '../../middleware/authentication';
import { router as adminRouter } from './admin';
router.use('/admin', isAdmin, adminRouter);

router.get('/ping', (req, res) => {
	res.json({ error: false, message: 'pong' });
});
