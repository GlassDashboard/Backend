import { getCached, setCached } from '../../express/middleware/cache';
import { BukkitSource, Datasource, Plugin, querySources } from '..';
import { timedFetch } from '../../http/utils';

const project_files = `https://api.curseforge.com/servermods/files?projectIds=`;

export default class BukkitDatasource implements Datasource {
	async getDescription(id: string): Promise<string | null> {
		return null;
	}

	async getPlugin(query: BukkitSource): Promise<Plugin | null> {
		const cached = getCached<Plugin>('datasource-bukkit-' + query.name);
		if (cached) return cached;

		const req = await timedFetch(project_files + query.source);
		if (req == null) return null;

		const data = await req.json();
		let files = {};

		for (const file of data) {
			files[file.gameVersion] = file.downloadUrl;
		}

		const plugin: Plugin = {
			id: query.source.toString(),
			name: query.name,
			testedVersions: [],
			file: files,
			rating: -1,
			icon: query.logo,
			premium: false,
			url: 'https://dev.bukkit.org/projects/' + query.name.toLowerCase(),
			source: 'Bukkit'
		};

		setCached('datasource-bukkit-' + query.name, plugin, 3600);
		return plugin;
	}

	async queryPlugins(query: string = '', size: number = 10, page: number = 1, sort: string = '-downloads'): Promise<{ plugins: Plugin[]; pages: number }> {
		const results = querySources(query, 'Bukkit', size, page);

		const plugins = (
			await Promise.all(
				results.sources.map(async (s) => await this.getPlugin(s as BukkitSource)) // [plugin|null]
			)
		).filter((p) => p != null) as Plugin[];

		return { plugins, pages: results.pages };
	}
}
