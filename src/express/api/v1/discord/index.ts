import { Router } from 'express';
export const router = Router();

require('dotenv').config();
import fetch from 'node-fetch';

import { AuthenticatedRequest, loggedIn } from '../../../middleware/authentication';
import { User, UserModel } from '../../../../data/models/user';
import { DocumentType } from '@typegoose/typegoose';

const DISCORD_AUTH = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT}&redirect_uri=${encodeURIComponent(process.env.DISCORD_CALLBACK!)}&response_type=code&scope=identify%20email`;

router.get('/data', loggedIn, async (req, res) => {
	const auth = <AuthenticatedRequest>req;

	let data: DocumentType<User> | null = await UserModel.findById(auth.discord.id);
	if (!data) data = (await User.create(auth.discord)) as DocumentType<User>;

	if (data.invalidateSession) return res.status(401).json({ error: true, message: 'Invalid session, please reauthenticate.' });

	if (data.avatar != auth.discord.avatar || data.tag != auth.discord.tag) {
		data.avatar = auth.discord.avatar;
		data.tag = auth.discord.tag;
		await data.save();
	}

	const user = {
		...data.toJson(),
		...auth.discord,
		avatar: `https://cdn.discordapp.com/avatars/${auth.discord.id}/${auth.discord.avatar}.png`
	};

	res.json(user);
});

router.get('/auth', async (req, res) => {
	if (!req.query.code) return res.redirect(DISCORD_AUTH);

	// Post to discord token endpoint
	const data = await fetch(`https://discord.com/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${Buffer.from(`${process.env.DISCORD_CLIENT}:${process.env.DISCORD_SECRET}`).toString('base64')}`
		},
		body: `code=${req.query.code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(process.env.DISCORD_CALLBACK!)}`
	}).then((response) => response.json());

	const discord = await fetch(`https://discordapp.com/api/users/@me`, {
		headers: {
			Authorization: `Bearer ${data.access_token}`
		}
	}).then((res) => res.json());

	if (!discord.id || !discord.email) return res.status(500).json({ error: true, message: 'Failed to get discord data', data: discord });

	var user: User | null = await UserModel.findById(discord.id);
	if (!user) await User.create(discord);

	// Update last authentication time
	await UserModel.updateOne({ _id: discord.id }, { $set: { lastLogin: Date.now() } });

	res.redirect(`${process.env.WEB_URL}/api/auth?token=${data.access_token}&expires=${data.expires_in}`);
});
