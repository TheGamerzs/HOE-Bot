import { Client, GatewayIntentBits } from 'discord.js';

import { connection as DB } from './db';
import cache from './util/cacheManager';
import { checkActiveGiveaways } from './util/giveaway';
import { join } from 'path';
import { readdirSync } from 'fs';

const prefix = process.env.PREFIX || '>';

const bot = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const events = readdirSync(join(__dirname, 'events')).map(file => {
	return require(join(__dirname, 'events', file));
});

events.forEach(event => {
	bot.on(event.name, event.run.bind(null, bot));
});

const interactions = readdirSync(join(__dirname, 'interactions')).map(file => {
	return require(join(__dirname, 'interactions', file));
});

bot.on('messageCreate', async message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	message.reply(
		'This bot now uses slash commands. Please use /help to see a list of commands.',
	);
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const commandToRun = interactions.find(
		cmd => cmd.name === interaction.commandName,
	);

	if (commandToRun) {
		await commandToRun.interaction(interaction, bot, DB);
	}
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isAutocomplete()) return;

	const commandToRun = interactions.find(
		cmd => cmd.name === interaction.commandName,
	);

	if (commandToRun) {
		await commandToRun.autocomplete(interaction, bot, DB);
	}
});

bot.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

	const commandToRun = interactions.find(
		cmd => cmd.name === interaction.customId,
	);

	if (commandToRun) {
		await commandToRun.button(interaction, bot, DB);
	}
});

(async() => {
	await DB.connect();
	await cache.setup(DB);
	console.log('Connected to database');
	console.log('Cached data');
	await bot.login(process.env.DISCORD_TOKEN);

	// Check for active giveaways
	await checkActiveGiveaways(bot, DB);

	try {
		await bot.application?.commands.set(
			interactions.map(interaction => {
				return {
					name: interaction.name,
					description: interaction.description,
					options: interaction.options,
				};
			}),
		);

		console.log('Registered interactions');
	} catch (error) {
		console.error(error);
	}
})();
