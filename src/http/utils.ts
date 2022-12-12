import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';

export async function timedFetch(uri: RequestInfo, data: RequestInit = {}, timeout: number = 3000): Promise<Response | null> {
	try {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), timeout);

		return await fetch(uri, {
			...data,
			signal: controller.signal
		});
	} catch (_) {
		return null;
	}
}
