const cache: Map<string, Cached<unknown>> = new Map();

export function getCached<V>(key: string): V | null {
	const item = cache.get(key);
	if (!item) return null;

	// Renew timeout on cached item
	clearTimeout(item.timeout);
	item.timeout = setTimeout(() => {
		cache.delete(key);
	}, item.ttl * 1000);

	return item.value as V;
}

export function setCached<V>(key: string, value: V, ttl: number = 120): V {
	const item = {
		value,
		ttl,
		timeout: setTimeout(() => {
			cache.delete(key);
		}, ttl * 1000)
	};

	cache.set(key, item);
    return value;
}

export interface Cached<V> {
	value: V;
	ttl: number;
	timeout: NodeJS.Timeout;
}
