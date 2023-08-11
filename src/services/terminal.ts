import chalk from 'chalk';

export interface Loggable {
	type: 'command' | 'console';
}

export interface Logged {
	timestamp: string;
	log: Loggable;
}

export interface CommandLog extends Loggable {
	user: string;
	command: string;
}

export interface ConsoleLog extends Loggable {
	log: string;
	level: LogLevel;
}

export const isCommandLog = (log: any): log is CommandLog => {
	if (!log) return false;
	return log.user && log.command && log.type == 'command';
};

export const isConsoleLog = (log: any): log is ConsoleLog => {
	if (!log) return false;
	return log.log != undefined && log.level && log.type == 'console';
};

export const isLog = (log: any): log is Logged => {
	return log.timestamp && (isCommandLog(log.log) || isConsoleLog(log.log));
};

const fixMinecraftCharacters = (log: string): string => {
	if (typeof log != 'string') return log;
	return log.replace(/[]/g, '§');
};

export const parseLog = (logged: Logged): string => {
	if (!isLog(logged)) return '';

	if (isCommandLog(logged.log)) {
		return format(
			LogType.COMMAND,
			`${chalk.bgMagenta(` ${logged.log.user} `)} executed command ${chalk.magentaBright.bold(
				logged.log.command
			)}`
		);
	}

	if (isConsoleLog(logged.log)) {
		switch (logged.log.level) {
			case 'FATAL':
			case 'ERROR':
				return format(LogType.ERROR, logged.log.log);
			case 'WARN':
				return format(LogType.WARN, logged.log.log);
			case 'INFO':
			case 'DEBUG':
			case 'TRACE':
				return format(LogType.INFO, logged.log.log);
			default:
				return (
					format(LogType.FAIL, `Failed to fetch proper log level for: ${logged.log.level}`) +
					'\n' +
					format(LogType.INFO, logged.log.log)
				);
		}
	}

	return '';
};

export const parseLogs = (logs: any[]): string[] => {
	if (!logs) return [];
	return logs.map(parseLog);
};

const parseMinecraft = (log: string): string => {
	const COLOR_CODE_REGEX = /(§[0-9a-fr])/gi;
	const fixed = fixMinecraftCharacters(log);

	function getPaired(text: string): [string, string][] {
		var current = '§f';
		var pairs: [string, string][] = [];

		const split = text.split(COLOR_CODE_REGEX);
		split.forEach((part) => {
			if (part.startsWith('§')) current = part;
			else if (part.trim() != '') pairs.push([part.replace('\n', ' '), current]);
			else pairs.push([part, current]);
		});

		return pairs;
	}

	const data = getPaired(fixed);
	var text = '';

	data.forEach(([part, current]) => {
		text += MinecraftColors[current](part);
	});

	return text;
};

export const format = (type: LogType, message: string | Error): string => {
	if (message instanceof Error) message = message.message;
	return type + '  ' + chalk.whiteBright(parseMinecraft(message));
};

export const LogType = {
	SUCCESS: chalk.green('✔'),
	FAIL: chalk.red('✖'),
	ERROR: chalk.red('🛇'),
	WARN: chalk.yellow('🛆'),
	INFO: chalk.blue('🛈'),
	COMMAND: chalk.magentaBright('/'),
	SYSTEM: chalk.blueBright('⚙ Glass')
};

const MinecraftColors = {
	'§1': chalk.blue,
	'§2': chalk.green,
	'§3': chalk.cyan.dim,
	'§4': chalk.red.dim,
	'§5': chalk.hex('#920092'),
	'§6': chalk.yellow,
	'§7': chalk.white.dim,
	'§8': chalk.hex('#808080'),
	'§9': chalk.cyan,
	'§0': chalk.gray.dim.dim,
	'§a': chalk.greenBright,
	'§b': chalk.cyanBright,
	'§c': chalk.red,
	'§d': chalk.magentaBright,
	'§e': chalk.yellowBright,
	'§f': chalk.whiteBright,
	'§l': chalk.bold,
	'§m': chalk.strikethrough,
	'§n': chalk.underline,
	'§o': chalk.italic,
	'§r': chalk.whiteBright
};

export type LogType = typeof LogType[keyof typeof LogType];
type LogLevel = 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
