import { Datasource, Plugin, GithubSource, getGithubSources, querySources } from '../index';
import { Octokit } from '@octokit/core';
import { setCached, getCached } from '../../express/middleware/cache';

const github = new Octokit({
	auth: process.env.GITHUB_AUTH
});

export default class GithubDatasource implements Datasource {
	async getDescription(id: string): Promise<string | null> {
		return null;
	}

	async getReleaseAssets(source: GithubSource, asset: number) {
		const sourceData = source.source.split('/');

		const { status, data } = await github.request(
			`GET /repos/{owner}/{repo}/releases/assets/{asset_id}`,
			{
				owner: sourceData[0],
				repo: sourceData[1],
				asset_id: asset
			}
		);
		if (Math.floor(status / 100) != 2) return null;

		return data;
	}

	async getPlugin(source: GithubSource): Promise<Plugin | null> {
		// Because of rate limiting, we'll use our express caching to cache the responses from github
		const cached = getCached<Plugin>('datasource-github-' + source.name);
		if (cached) return cached;

		const sourceData = source.source.split('/');
		if (sourceData.length < 2) return null;

		const { status: repoStatus, data: repo } = await github.request(`GET /repos/{owner}/{repo}`, {
			owner: sourceData[0],
			repo: sourceData[1]
		});
		if (Math.floor(repoStatus / 100) != 2) return null;

		const { status: releaseStatus, data: rawReleases } = await github.request(
			`GET /repos/{owner}/{repo}/releases`,
			{
				owner: sourceData[0],
				repo: sourceData[1]
			}
		);
		if (Math.floor(releaseStatus / 100) != 2) return null;
		let files = {};

		const releases = rawReleases.map((r) => {
			return { id: r.id, name: r.tag_name, assets: r.assets };
		});

		for (const release of releases) {
			const asset = release.assets.filter((asset) => {
				return source['content-type'].includes(asset.content_type);
			})[0];
			if (!asset) continue;

			files[release.name] = asset.browser_download_url;
		}

		const plugin: Plugin = {
			id: repo.id.toString(),
			name: repo.name,
			testedVersions: [],
			file: files,
			rating: -1,
			icon: (repo.organization || repo.owner).avatar_url,
			premium: false,
			url: `https://github.com/${sourceData.join('/').toLowerCase()}`,
			source: 'Github'
		};

		setCached('datasource-github-' + source.name, plugin, 3600);
		return plugin;
	}

	/*
        This method doesn't support sorting, there are no stats to sort by.
    */
	async queryPlugins(
		query: string = '',
		size: number = 10,
		page: number = 1,
		sort: string = '-downloads'
	): Promise<{ plugins: Plugin[]; pages: number }> {
		const results = querySources(query, 'Github', size, page);

		const plugins = (
			await Promise.all(
				results.sources.map(async (s) => await this.getPlugin(s as GithubSource)) // [plugin|null]
			)
		).filter((p) => p != null) as Plugin[];

		return { plugins, pages: results.pages };
	}
}
