import { Router } from 'express';
export const router = Router();

require('dotenv').config();
import fetch from 'node-fetch';

import { AuthenticatedRequest, loggedIn } from 'src/express/middleware/authentication';
import { User, UserModel } from 'src/data/models/user';

const DISCORD_AUTH = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT}&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fv1%2Fdiscord%2Fauth&response_type=code&scope=identify%20email`;

router.get('/data', loggedIn, async (req, res) => {
	const auth = req as AuthenticatedRequest;

    let data: User | null = await UserModel.findById(auth.discord.id);
    if (!data) data = await User.create(auth.discord);

	const user = { ...data.toJson(), ...auth.discord, avatar: `https://cdn.discordapp.com/avatars/${auth.discord.id}/${auth.discord.avatar}.png` };

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
		body: `code=${req.query.code}&grant_type=authorization_code&redirect_uri=http://localhost:8080/v1/discord/auth`
	}).then((response) => response.json());

	const discord = await fetch(`https://discordapp.com/api/users/@me`, {
		headers: {
			Authorization: `Bearer ${data.access_token}`
		}
	}).then((res) => res.json());

	if (!discord.id || !discord.email) return res.redirect(DISCORD_AUTH);

	var user: User | null = await UserModel.findById(discord.id);
	if (!user) await User.create(discord);

	res.redirect(`http://localhost:3000/api/auth?token=${data.access_token}&expires=${data.expires_in}`);
});
