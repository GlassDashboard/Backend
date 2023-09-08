import { Get, HttpError, JsonController, Param, QueryParam, Req, Res } from 'routing-controllers';
import * as cdn from '@service/cdn';
import { ID } from '~/wrapper/typeid';
import { Response } from 'express';

@JsonController('/cdn')
export class CDNController {
	@Get('/:file')
	async getFile(
		@Param('file') file: string,
		@QueryParam('access_token') token: string,
		@Res() res: Response
	) {
		const id = ID.fromString<'cdn'>(file);
		if (!id) throw new HttpError(404, 'File not found');

		const metadata = await cdn
			.findFile(id, token)
			.then((metadata) => metadata)
			.catch((e: Error) => {
				if (e.message == 'File not found') throw new HttpError(404, 'File not found');
				if (e.message == 'File has expired') throw new HttpError(410, 'File has expired');
				if (e.message == 'Invalid access token') throw new HttpError(401, 'Invalid access token');
			});
		if (!metadata) throw new HttpError(404, 'File not found');

		await new Promise((resolve, reject) => {
			res.download(
				metadata.path.substring(cdn.getRoot().length),
				metadata.name,
				{
					dotfiles: 'deny',
					root: cdn.getRoot()
				},
				(err) => {
					if (!err) {
						// Success, delete the file
						cdn.deleteFile(id);
						return resolve(null);
					}

					if (res.headersSent) {
						console.log('Failed to send file, partial download was sent: ' + err.message);
						return resolve(null);
					}

					reject(new HttpError(500, 'Internal server error: ' + err.message));
				}
			);
		}).catch((e: HttpError) => {
			throw e;
		});
	}
}
