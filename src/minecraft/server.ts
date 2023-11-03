export const NAME_REGEX = /^[a-z0-9-_. ]{3,20}$/gi;

export const ServerTypes = [
	'SPIGOT',
	'PAPER',
	'FORGE',
	'FABRIC',
	'BUNGEECORD',
	'VELOCITY',
	'PURPUR',
	'UNKNOWN'
] as const;
export type ServerType = typeof ServerTypes[number];
