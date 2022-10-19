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
import {io} from "../../../socket";
router.use('/admin', isAdmin, adminRouter);

router.get('/ping', (req, res) => {
	res.json({ error: false, message: 'pong' });
});

router.get('/test/:test', (req, res) => {
    const test = parseInt(req.params['test']);

    if (test == 1) {
        io.to('santiotest').emit('EXECUTE_COMMAND', JSON.stringify({
            user: 'Santio71#3822',
            command: 'say hey',
            original: 'say hey'
        }))
    }

    res.json({done:true, test});
})