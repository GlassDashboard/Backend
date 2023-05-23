import { HttpError } from 'routing-controllers';
import { ServerPermission } from '~/authentication/permissions';

export class ServerNotFoundError extends HttpError {
	constructor() {
		super(404, 'Server not found');
	}
}

/**
 * This error is sent when a player is missing a permission to perform an action.
 */
export class InsufficientPermissionsError extends HttpError {
	constructor(permission: string | null = null) {
		super(403, permission ? `You are not permitted to perform this action. You are missing the ${permission} scope.` : 'You are not permitted to perform this action.');
	}
}

/**
 * This error is sent when a player is missing multiple scopes to either view an action or perform an action.
 */
export class MissingScopesError extends HttpError {
	constructor(scopes: string[]) {
		super(403, `You are not permitted to do this! Scopes required: ${scopes.join(', ')}`);
	}
}
