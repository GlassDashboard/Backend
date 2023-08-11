import { Datasource, Plugin, Github, GithubSource, HEADERS } from '../index';
import { timedFetch } from '../../http/utils';

const github_regex = /^https?:\/\/(?:www\.)?github\.com\/([^\/]+\/[^\/]+)/gi;
const resource_uri = 'https://api.spiget.org/v2/resources';
const search_uri = 'https://api.spiget.org/v2/resources/free';
const query_search_uri = 'https://api.spiget.org/v2/search/resources';
const fields = `fields=${encodeURIComponent(
	'id,name,testedVersions,file,rating,icon,premium,version,external,sourceCodeLink'
)}`;

export default class SpigetDatasource implements Datasource {
	async getDescription(id: string): Promise<string | null> {
		const req = await timedFetch(`${resource_uri}/${id}`, { HEADERS });
		if (req == null) return null;

		const plugin = await req.json();
		// @ts-ignore
		return !plugin.description
			? 'No description provided.'
			: new Buffer(plugin.description, 'base64')
					.toString('ascii')
					.replace(/src="\/\//gi, 'src="https://') // Do some quick URL fixing
					.replace(/b[^\w.<>\[\] \t\n]+/gi, '') // Fix mistakes in the api
					.replace(
						/<div class="type"> ?Code \(\w+\): <\/div> <div class="code">(.*?)<\/div> ?<\/div>/gi,
						'<code>$1</code>'
					); // Code blocks
	}

	async getPlugin(query: string): Promise<Plugin | null> {
		return new Promise((resolve) => {
			this.queryPlugins((query as any).name || query, 1).then(
				(results: { plugins: Plugin[]; pages: number }) => {
					resolve(results.plugins[0]);
				}
			);
		});
	}

	async queryPlugins(
		query: string = '',
		size: number = 10,
		page: number = 1,
		sort: string = '-downloads'
	): Promise<{ plugins: Plugin[]; pages: number }> {
		const info = `?size=${size}&page=${page}&sort=${sort}`;
		const uri = (query == '' ? search_uri : `${query_search_uri}/${query}`) + `${info}&${fields}`;

		const req = await timedFetch(uri, { HEADERS });
		if (!req) return { plugins: [], pages: 1 };
		const data = await req.json();

		const plugins: Plugin[] = [];

		for (const resource of data) {
			let files = {};

			if (resource.file.type != 'external')
				files[resource.version.id] = `https://spigotmc.org/${resource.file.url}`;
			else if (resource.sourceCodeLink && github_regex.test(resource.sourceCodeLink)) {
				// Use github for fetching files
				const src = resource.sourceCodeLink.replace(github_regex, '$1');
				const name = src.split('/')[0];

				// We'll opt for finding the first jar in the github releases
				const source = {
					name,
					source: src,
					'content-type': [
						'application/octet-stream',
						'application/java-archive',
						'application/jar'
					],
					file_index: 0
				} as GithubSource;

				const plugin: Plugin | null = await Github.getPlugin(source);
				if (!plugin) continue;

				files = plugin.file;
			}

			const plugin: Plugin = {
				id: resource.id.toString(),
				name: resource.name,
				testedVersions: resource.testedVersions || [],
				file: files,
				rating: Math.floor(resource.rating.average * 10) / 10,
				icon: `https://www.spigotmc.org/${resource.icon.url}`,
				premium: resource.premium,
				url: `https://www.spigotmc.org/resources/${encodeURIComponent(resource.name)}.${
					resource.id
				}/`,
				source: 'Spigot'
			};

			plugins.push(plugin);
		}

		return { plugins, pages: req.headers.get('x-page-count') };
	}
}
