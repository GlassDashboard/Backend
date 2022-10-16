const cache: Map<string, Cached> = new Map();

export function getCached(key: string): any {
	const item = cache.get(key);
	if (!item) return null;

	// Renew timeout on cached item
	clearTimeout(item.timeout);
	item.timeout = setTimeout(() => {
		cache.delete(key);
	}, item.ttl * 1000);

	return item.value;
}

export function setCached(key: string, value: any, ttl: number = 120): void {
	const item = {
		value,
		ttl,
		timeout: setTimeout(() => {
			cache.delete(key);
		}, ttl * 1000)
	};

	cache.set(key, item);
}

export interface Cached {
	value: any;
	ttl: number;
	timeout: NodeJS.Timeout;
}
