import ms from 'ms';

// Custom rate limit handler
// This defines per-route rate limits, either ip-based or globally

export default (
	limit: number,
	time: number | string,
	global: boolean = false,
	exclude: string[] = []
) => {
	let hits = {};
	if (time == undefined) time = 60000;
	else time = ms(time);

	// Clear limits
	setInterval(() => {
		hits = {};
	}, time as number);

	return (req, res, next) => {
		if (exclude.includes(req.path)) return next();

		let key: string = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if (global) key = 'global';

		// Headers
		res.setHeader('X-RateLimit-Limit', limit);
		res.setHeader('Date', new Date().toUTCString());

		// Check if rate limit is reached
		if ((hits[key] || 0) >= limit) {
			res.setHeader('X-RateLimit-Remaining', 0);
			return res.status(429).json({
				error: true,
				message: 'You are being rate limited! Try again later.'
			});
		} else {
			hits[key] = Math.min((hits[key] || 0) + 1, limit);
			res.setHeader('X-RateLimit-Remaining', limit - (hits[key] || 0));
			next();
		}
	};
};
