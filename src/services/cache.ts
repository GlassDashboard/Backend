type CacheData = {
	// The time to live of the cache in milliseconds
	ttl?: number;
	// Whether or not to refresh the TTL when the cached item is accessed
	refreshTTL?: boolean;
};

export default class Cache<T> {
	private data: CacheData;
	private cache: Map<string, T> = new Map();
	private ttl: Map<string, NodeJS.Timeout> = new Map();

	constructor(data: CacheData) {
		this.data = {
			// defaults:
			ttl: 1000 * 30,
			refreshTTL: true,

			...data
		};
	}

	public get(key: string): T | null {
		const cached = this.cache.get(key);

		if (!cached) return null;
		if (this.data.refreshTTL) this.cache.set(key, cached);

		return cached;
	}

	public getOrDefault(key: string, defaultValue: T): T {
		return this.get(key) || defaultValue;
	}

	public async getOrFetch(
		key: string,
		defaultValue: () => Promise<T | null> | T | null
	): Promise<T | null> {
		const cached = this.get(key);
		if (cached) return cached;

		const value = await defaultValue();
		if (value == null) return null;

		this.set(key, value);
		return value;
	}

	public set(key: string, value: T): void {
		this.cache.set(key, value);
		this.ttl.set(
			key,
			setTimeout(() => this.delete(key), this.data.ttl)
		);
	}

	public delete(key: string): void {
		this.cache.delete(key);

		clearTimeout(this.ttl.get(key));
		this.ttl.delete(key);
	}

	public clear(): void {
		this.cache.clear();
	}

	public has(key: string): boolean {
		return this.cache.has(key);
	}

	public get size(): number {
		return this.cache.size;
	}
}
