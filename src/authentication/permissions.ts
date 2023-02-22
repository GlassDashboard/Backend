// This file contains all data on permissions, along with some util methods

// All permissions
import Permissionable from './permissionable';

export const ServerPermission = {
	// Default Permissions
	VIEW_CONSOLE: 2n ** 0n,
	USE_CONSOLE: 2n ** 1n,
	CONTROL_SERVER: 2n ** 2n,
	READ_FILES: 2n ** 3n,
	WRITE_FILES: 2n ** 4n,
	MANAGE_PLAYERS: 2n ** 5n,
	VIEW_PERFORMANCE: 2n ** 6n,
	VIEW_PLUGINS: 2n ** 7n,
	MANAGE_PLUGINS: 2n ** 8n,
	FTP_ACCESS: 2n ** 9n,

	// Management Permissions
	MANAGE_SUBUSERS: 2n ** 10n,
	MANAGE_INTEGRATIONS: 2n ** 11n,
	MANAGE_SERVER: 2n ** 12n
};

export const DEFAULT_PERMISSIONS = ServerPermission.VIEW_CONSOLE;

export function hasPermission(user: Permissionable, permission: bigint): boolean {
	return permission == -1n || !!(BigInt(user.permissions) & permission);
}
