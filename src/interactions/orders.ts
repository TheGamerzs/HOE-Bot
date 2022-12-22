// Description: View active orders

import { ApplicationCommandOption, ChatInputCommandInteraction, Client } from 'discord.js';

import { Connection } from 'mysql';
import { createEmbed } from '../util/embeds';
import { dbQuery } from '../util/sql';
import { titleCase } from '../util/string';

export const name = 'orders';
export const description = 'View your current orders';
export const options: ApplicationCommandOption[] = [];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const userId = interaction.user.id;

	const Query = await dbQuery(
		DB,
		"SELECT * FROM `order` WHERE `customer` = ? AND `status` IN ('pending', 'in progress')",
		[userId]
	);

	if (!Query[0]) return interaction.reply('You have no orders');

	const orders = Query as Order[];

	const embed = createEmbed(null, null, 0x00ff00, {
		name: interaction.user.username,
		iconURL: interaction.user.displayAvatarURL(),
	});

	// For each field of orders
	for (const order of orders) {
		const grinder = order.grinder ? `<@${order.grinder}>` : 'Not Claimed';
		const storage = order.storage ?? 'Not Given';

		const orderDescription =
			`**Product:** ${titleCase(order.product)}` +
			`\n**Amount:** ${order.amount}` +
			`\n**Status:** ${order.status}` +
			`\n**Cost:** $${order.cost}` +
			`\n**Storage:** ${storage}` +
			`\n**Priority**: ${order.priority ? 'High' : 'Normal'}` +
			`\n**Grinder:** ${grinder}`;

		embed.addFields({
			name: `Order ID: ${order.order_id}`,
			value: orderDescription,
			inline: true,
		});
	}

	interaction.reply({ embeds: [embed] });
};
