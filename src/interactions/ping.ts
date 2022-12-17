// Description: Ping command

import { ChatInputCommandInteraction, Client } from 'discord.js';

import { Connection } from 'mysql';

export const name = 'ping';
export const description = 'Pong!';
export const options = [];

export const interaction = async(
	interaction: ChatInputCommandInteraction,
	bot: Client,
	DB: Connection,
) => {
	interaction.reply(`Pong! ${bot.ws.ping}ms`);
};
