// Description: Claim an order using the order ID

import {
	ApplicationCommandOption,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
	TextChannel,
} from 'discord.js';

import { Connection } from 'mysql';
import { dbQuery } from '../util/sql';

export const name = 'delivered';
export const description = 'Mark an order as delivered';
export const options: ApplicationCommandOption[] = [
	{
		name: 'order',
		description: 'The order to claim',
		type: ApplicationCommandOptionType.String,
		required: true,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const orderId = interaction.options.getString('order', true);

	const Query = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [orderId]);

	if (!Query[0]) return interaction.reply('Order not found');

	const order = Query[0] as Order;

	if (order.status !== 'completed')
		return interaction.reply({
			content: 'Order is not completed',
			ephemeral: true,
		});
	if (order.grinder !== interaction.user.id)
		return interaction.reply({
			content: 'Order is not yours',
			ephemeral: true,
		});

	await dbQuery(DB, "UPDATE `order` SET `status` = 'delivered' WHERE `order_id` = ?", [interaction.user.id, orderId]);

	await interaction.reply({
		content: `Order#${orderId} marked as delivered`,
	});

	const logChannel = bot.channels.cache.find((channel) => channel.id === process.env.LOG_CHANNEL) as TextChannel;

	if (!logChannel) return;

	await logChannel.send({
		embeds: [
			{
				title: 'Order Delivered',
				description: `Order \`${order.order_id}\` delivered by <@${interaction.user.id}>`,
				color: 0x00ff00,
			},
		],
	});
};
