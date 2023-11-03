import { Request } from 'express';
import { createParamDecorator } from 'routing-controllers';

export interface FilePath {
	path: string;
	root: boolean;
}

export function FilePath() {
	return createParamDecorator({
		required: true,
		value: async (action) => {
			const req = action.request as Request;
			let root = req.query['root'] == 'true';
			// We need to enforce root to glass admins only, so we'll just set it to false for now.
			root = false;

			return {
				path: '/' + (req.params['0'] ?? ''),
				root
			} as FilePath;
		}
	});
}

export type Path = {
	path: string;
	root: boolean;
};
