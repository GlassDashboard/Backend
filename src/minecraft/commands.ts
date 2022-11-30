import { Discord } from '../authentication/discord';

export function processor(user: Discord, command: string): ProcessedCommandData {
	let newCommand = command;
	let cancelled = false;

	if (isCommand('minecraft', 'say', command)) {
		const message = command.split(' ').slice(1).join(' ').replace(/"/g, '\\"');
		newCommand = `minecraft:tellraw @a [{"text":"[@${user.username}] ","color":"#aa55aa"},{"text":"${message}","color":"white"}]`;
	}

	return {
		cancelled,
		original: command,
		command: newCommand
	};
}

function isCommand(plugin: string, command: string, provided: string): boolean {
	const rawCommand = provided.split(' ')[0];
	const commandProvided = rawCommand.startsWith('/') ? rawCommand.substring(1) : rawCommand;
	return commandProvided.toLowerCase() == command.toLowerCase() || commandProvided.toLowerCase() == plugin.toLowerCase() + ':' + command.toLowerCase();
}

export interface ProcessedCommandData {
	cancelled: boolean;
	original: string;
	command: string;
}
