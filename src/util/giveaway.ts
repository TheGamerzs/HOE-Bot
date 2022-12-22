import { ButtonBuilder, ChannelType, Client, EmbedBuilder, TextChannel } from 'discord.js';

import { Connection } from 'mysql';
import { dbQuery } from './sql';

export async function checkActiveGiveaways(bot: Client, DB: Connection) {
	return new Promise<void>(async (resolve, reject) => {
		const Query = (await dbQuery(DB, 'SELECT * FROM `giveaway` WHERE `ended` = 0', [])) as Giveaway[];

		console.log(`Found ${Query.length} giveaways`);

		for (const giveaway of Query) {
			let channel = (await bot.channels.cache.get(giveaway.channelId)) as TextChannel;
			if (!channel) {
				// Fetch giveaway channel
				channel = (await bot.channels.fetch(giveaway.channelId)) as TextChannel;
				if (!channel) {
					console.log(`Channel ${giveaway.channelId} not found`);
					continue;
				}
			}

			if (channel.type !== ChannelType.GuildText) {
				console.log(`Channel ${giveaway.channelId} is not a text channel`);
				continue;
			}

			const message = await channel.messages.fetch(giveaway.messageId);
			if (!message) {
				console.log(`Message ${giveaway.messageId} not found`);
				continue;
			}

			if (giveaway.endTimestamp * 1000 < Date.now()) {
				console.log(`Ending giveaway ${giveaway.id}`);
				endGiveaway(bot, giveaway.id, DB);
			} else {
				console.log(`Ending giveaway ${giveaway.id} in ${giveaway.endTimestamp * 1000 - Date.now()} ms`);
				setTimeout(() => {
					endGiveaway(bot, giveaway.id, DB);
				}, giveaway.endTimestamp * 1000 - Date.now());
			}
		}

		return resolve();
	});
}

export async function endGiveaway(bot: Client, id: number, DB: Connection) {
	console.log(`ID: ${id}`);
	const giveaways = await dbQuery(DB, 'SELECT * FROM `giveaway` WHERE `id` = ?', [id]);

	if (giveaways.length === 0) {
		return console.log(`Giveaway ${id} not found`);
	}

	const giveaway = giveaways[0] as Giveaway;

	const channel = bot.channels.cache.get(giveaway.channelId) as TextChannel;
	if (!channel) {
		return console.error(`Channel ${giveaway.channelId} not found`);
	}
	const message = await channel.messages.fetch(giveaway.messageId);
	if (!message) return console.error(`Message ${giveaway.messageId} not found`);

	const entries = await dbQuery(DB, 'SELECT * FROM `giveaway_entries` WHERE `giveaway` = ?', [id]);

	if (entries.length === 0) {
		return await message.reply('No one entered the giveaway!');
	}

	const winners: any[] = [];

	while (winners.length < giveaway.winnerCount) {
		const winner = entries[Math.floor(Math.random() * entries.length)];

		if (winners.some((w) => w.user === winner.user)) continue;

		winners.push(winner);
	}

	console.log(winners);

	const msgEmbed = new EmbedBuilder(message.embeds[0].data);

	msgEmbed.addFields([
		{
			name: 'Duration',
			value: `Ended: <t:${giveaway.endTimestamp}:R>`,
		},
		{
			name: 'Winners',
			value: winners.map((winner: any) => `<@${winner.user}>`).join(', '),
		},
	]);

	msgEmbed.spliceFields(2, 2);

	const entriesBtn = new ButtonBuilder(message.components[0]?.components[1]?.data ?? {});

	if (!entriesBtn.data.label?.includes('Entries')) {
		entriesBtn.setLabel(`Entries: ${entries.length}`).setDisabled(true).setStyle(4);
	}

	await message.edit({
		embeds: [msgEmbed],
		components: [
			{
				type: 1,
				components: [entriesBtn],
			},
		],
	});

	await message.reply({
		content: `Congratulations ${winners.map((winner: any) => `<@${winner.user}>`).join(', ')}! You won ${
			giveaway.prize
		}!\nPlease DM <@${giveaway.hostId}> to claim your prize!`,
	});

	await dbQuery(DB, 'UPDATE `giveaway` SET `ended` = 1 WHERE `id` = ?', [id]);

	await dbQuery(DB, 'INSERT INTO `giveaway_winner` (`user`, `giveaway`) VALUES ?', [
		winners.map((winner: any) => [winner.user, id]),
	]);
}
