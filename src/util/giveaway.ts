import {
	ButtonBuilder,
	ChannelType,
	Client,
	EmbedBuilder,
	TextChannel
} from "discord.js";

import { Connection } from "mysql";
import { createEmbed } from "./embeds";
import { dbQuery } from "./sql";

export async function checkActiveGiveaways(bot: Client, DB: Connection) {
	return new Promise<void>(async (resolve, reject) => {
		const Query = await dbQuery(
			DB,
			"SELECT * FROM `giveaway` WHERE `ended` = 0",
			[]
		);

		console.log(`Found ${Query.length} giveaways`);

		for (const giveaway of Query) {
			const channel = bot.channels.cache.get(giveaway.channelId);
			if (!channel) continue;
			if (channel.type !== ChannelType.GuildText) continue;

			const message = await channel.messages.fetch(giveaway.messageId);
			if (!message) continue;

			if (giveaway.endTimestamp * 1000 < Date.now()) {
				endGiveaway(bot, giveaway.id, DB);
			} else {
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
	const giveaway = await dbQuery(
		DB,
		"SELECT * FROM `giveaway` WHERE `id` = ?",
		[id]
	);

	if (giveaway.length === 0) {
		return;
	}

	const channel = bot.channels.cache.get(giveaway[0].channelId) as TextChannel;
	const message = await channel.messages.fetch(giveaway[0].messageId);

	const entries = await dbQuery(
		DB,
		"SELECT * FROM `giveaway_entries` WHERE `giveaway` = ?",
		[id]
	);

	await dbQuery(DB, "UPDATE `giveaway` SET `ended` = 1 WHERE `id` = ?", [id]);

	if (entries.length === 0) {
		return await message.reply("No one entered the giveaway!");
	}

	const winners: any[] = [];

	for (let i = 0; i < giveaway[0].winnerCount; i++) {
		const random = Math.floor(Math.random() * entries.length);
		if (!winners.includes(entries[random])) {
			winners.push(entries[random]);
		}
	}

	const msgEmbed = new EmbedBuilder(message.embeds[0].data);

	msgEmbed.addFields([
		{
			name: "Duration",
			value: `Ended: <t:${giveaway[0].endTimestamp}:R>`
		},
		{
			name: "Winners",
			value: winners.map((winner: any) => `<@${winner.user}>`).join(", ")
		}
	]);

	msgEmbed.spliceFields(2, 2);

	const entriesBtn = new ButtonBuilder(
		message.components[0]?.components[1]?.data ?? {}
	);

	if (!entriesBtn.data.label?.includes("Entries")) {
		entriesBtn
			.setLabel(`Entries: ${entries.length}`)
			.setDisabled(true)
			.setStyle(4);
	}

	await message.edit({
		embeds: [msgEmbed],
		components: [
			{
				type: 1,
				components: [entriesBtn]
			}
		]
	});

	await message.reply({
		content: `Congratulations ${winners
			.map((winner: any) => `<@${winner.user}>`)
			.join(", ")}! You won ${giveaway[0].prize}!\nPlease DM <@${
			giveaway[0].hostId
		}> to claim your prize!`
	});

	await dbQuery(
		DB,
		"INSERT INTO `giveaway_winner` (`user`, `giveaway`) VALUES ?",
		[winners.map((winner: any) => [winner.user, id])]
	);
}
