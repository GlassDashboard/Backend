// Constants
export type Scopes = 'Github' | 'Bukkit';
const sources: Source[] = require('../../sources.json');

import SpigetDatasource from './datasource/spiget';
const Spiget = new SpigetDatasource();

import GithubDatasource from './datasource/github';
export const Github = new GithubDatasource();

import BukkitDatasource from './datasource/bukkit';
export const Bukkit = new BukkitDatasource();

export const HEADERS = {
	// Headers to attach to all requests
	accept: 'application/json',
	'User-Agent': 'Glass/backend by Santio71'
};

import { compareTwoStrings } from 'string-similarity';

/*
    Not the prettiest solution, but it does work quite well.
*/

// Util Methods
export async function getPlugin(query: string): Promise<Plugin | null> {
	return new Promise((resolve) => {
		Spiget.getPlugin(query).then((plugin) => {
			if (!!plugin) resolve(plugin);
		});
	});
}

export async function getDescription(id: string): Promise<string | null> {
	return await Spiget.getDescription(id);
}

export async function getPlugins(query: string = '', size: number = 10, page: number = 1, sort: string = '-downloads'): Promise<{ plugins: Plugin[]; pages: number }> {
	const spigetResults = await Spiget.queryPlugins(query, size, page, sort);
	const githubResults = await Github.queryPlugins(query, size, page);
	const bukkitResults = await Bukkit.queryPlugins(query, size, page);

	let plugins: Plugin[] = githubResults.plugins;
	plugins = plugins.concat(bukkitResults.plugins.slice(0, bukkitResults.plugins.length - plugins.length));
	plugins = plugins.concat(spigetResults.plugins.slice(0, spigetResults.plugins.length - plugins.length));

	// Typescript has weird behaviour sometimes, adding ints in this case is one of those
	return {
		plugins,
		pages: parseInt(githubResults.pages.toString()) + parseInt(spigetResults.pages.toString())
	};
}

export function getGithubSources(): GithubSource[] {
	return sources.filter((source: Source) => source.scope == 'Github') as GithubSource[];
}

export function getBukkitSources(): BukkitSource[] {
	return sources.filter((source: Source) => source.scope == 'Bukkit') as BukkitSource[];
}

export function querySources(query: string, scope: Scopes, size: number = 10, page: number = 1): { sources: Source[]; pages: number } {
	const results: Source[] = sources.filter((source) => source.scope == scope && compareTwoStrings(source.name.toLowerCase(), query.toLowerCase()) > 0.7);

	return { sources: results.slice((page - 1) * size, page * size), pages: Math.max(Math.ceil(results.length / size), 0) };
}

// Interfaces & Abstractions
export interface Plugin {
	id: string;
	name: string;
	testedVersions: string[];
	file: {
		[key: string]: string;
	};
	rating: number;
	icon: string;
	premium: boolean;
	url: string;
	source: 'Spigot' | Scopes;
}

interface Source {
	name: string;
	scope: Scopes;
	source: string | number;
	'content-type'?: string[];
	file_index?: number;
	logo?: string;
}

export interface GithubSource {
	name: string;
	scope: 'Github';
	source: string;
	'content-type': string[];
	file_index: number;
}

export interface BukkitSource {
	name: string;
	scope: 'Bukkit';
	source: number;
	logo: string;
}

export abstract class Datasource {
	abstract getPlugin(query: Source | string): Promise<Plugin | null>;
	abstract queryPlugins(query: string, size: number, page: number, sort: string): Promise<{ plugins: Plugin[]; pages: number }>;
	abstract getDescription(id: string): Promise<string | null>;
}
