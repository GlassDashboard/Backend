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
	level: LogType;
}

export const isCommandLog = (log: any): log is CommandLog => {
	if (!log) return false;
	return log.user && log.command && log.type == 'command';
};

export const isConsoleLog = (log: any): log is ConsoleLog => {
	if (!log) return false;
	return log.log && log.level && log.type == 'console';
};

export const isLog = (log: any): log is Logged => {
	return log.timestamp && (isCommandLog(log.log) || isConsoleLog(log.log));
};

export const parseLog = (logged: Logged): string => {
	if (!isLog(logged)) return '';

	if (isCommandLog(logged)) return format(Type.COMMAND, `${chalk.magentaBright(logged.user)} executed command ${chalk.magentaBright(logged.command)}`);

	if (isConsoleLog(logged.log)) {
		switch (logged.log.level) {
			case 'FATAL':
			case 'ERROR':
				return format(Type.ERROR, logged.log.log);
			case 'WARN':
				return format(Type.WARN, logged.log.log);
			case 'INFO':
			case 'DEBUG':
			case 'TRACE':
				return format(Type.INFO, logged.log.log);
			default:
				return format(Type.FAIL, `Failed to fetch proper log level for: ${logged.log.level}`) + '\n' + format(Type.INFO, logged.log.log);
		}
	}

	return '';
};

export const parseLogs = (logs: any[]): string[] => {
	if (!logs) return [];
	return logs.map(parseLog);
};

const format = (type: Type, message: string): string => {
	return type + '  ' + chalk.whiteBright(`${message}`);
};

const Type = {
	SUCCESS: chalk.green('✔'),
	FAIL: chalk.red('✖'),
	ERROR: chalk.red('🛇'),
	WARN: chalk.yellow('🛆'),
	INFO: chalk.blue('🛈'),
	COMMAND: chalk.magentaBright('/'),
	SYSTEM: chalk.blueBright('⚙ Glass')
};

type LogType = 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
type Type = typeof Type[keyof typeof Type];
