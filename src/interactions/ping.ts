// Description: Ping command

import { ApplicationCommandOption, ChatInputCommandInteraction, Client } from 'discord.js';

import { Connection } from 'mysql';

export const name = 'ping';
export const description = 'Pong!';
export const options: ApplicationCommandOption[] = [];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	interaction.reply(`Pong! ${bot.ws.ping}ms`);
};
