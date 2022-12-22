// Description: View your current grinding orders

import {
	ApplicationCommandOption,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
} from 'discord.js';

import { Connection } from 'mysql';
import { createEmbed } from '../util/embeds';
import { dbQuery } from '../util/sql';
import { titleCase } from '../util/string';

export const name = 'current';
export const description = 'View your current grinding orders';
export const options: ApplicationCommandOption[] = [
	{
		name: 'user',
		description: 'The user to view the orders of',
		type: ApplicationCommandOptionType.User,
		required: false,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const user = (await interaction.options.getUser('user', false)) ?? interaction.user;

	const Query = await dbQuery(
		DB,
		'SELECT * FROM `order` WHERE (`status` = `in progress` OR `status` = `completed`) AND `grinder` = ?',
		[user?.id]
	);

	if (!Query[0]) return interaction.reply('You have not claimed any orders');

	const embed = createEmbed(null, null, 0x00ff00, {
		name: 'Current Grinding Orders',
		iconURL: user.displayAvatarURL(),
	});

	for (const order of Query) {
		const orderData = order as Order;

		embed.addFields({
			name: `Order ID: ${orderData.order_id}`,
			value: `Customer: <@${orderData.customer}>\nProduct: ${titleCase(orderData.product)}\nAmount: ${
				orderData.amount
			}\nCost: $${orderData.cost}\n Progress: ${orderData.progress.toString() || 'N/A'}`,
			inline: true,
		});
	}

	interaction.reply({ embeds: [embed] });
};
