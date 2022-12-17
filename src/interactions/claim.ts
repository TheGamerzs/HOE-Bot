// Description: Claim an order using the order ID

import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
	TextChannel
} from "discord.js";

import { Connection } from "mysql";
import { dbQuery } from "../util/sql";

export const name = "claim";
export const description = "Claim an order";
export const options = [
	{
		name: "order",
		description: "The order to claim",
		type: ApplicationCommandOptionType.String,
		required: true
	}
];

export const interaction = async (
	interaction: ChatInputCommandInteraction,
	bot: Client,
	DB: Connection
) => {
	const orderId = interaction.options.getString("order", true);

	const Query = await dbQuery(DB, "SELECT * FROM `order` WHERE `orderId` = ?", [
		orderId
	]);

	if (!Query[0]) return interaction.reply("Order not found");

	const order = Query[0] as Order;

	if (order.status !== "pending")
		return interaction.reply({
			content: "Order is already claimed",
			ephemeral: true
		});
	if (order.grinder)
		return interaction.reply({
			content: "Order is already claimed",
			ephemeral: true
		});

	await dbQuery(
		DB,
		"UPDATE `order` SET `grinder` = ?, `status` = 'in progress' WHERE `order_id` = ?",
		[interaction.user.id, orderId]
	);

	// Delete the message
	const channel = (await bot.channels.cache.find(channel =>
		channel.id === order.storage
			? process.env.CARGO_ORDERS_CHANNEL
			: process.env.BXP_ORDERS_CHANNEL
	)) as TextChannel;

	if (!channel) return;

	const message = await channel.messages.fetch(order.messageid);

	await message.delete();

	await interaction.reply({
		content: "Order claimed",
		ephemeral: true
	});

	const logChannel = bot.channels.cache.find(
		channel => channel.id === process.env.LOG_CHANNEL
	) as TextChannel;

	if (!logChannel) return;

	await logChannel.send({
		embeds: [
			{
				title: "Order claimed",
				description: `Order \`${order.order_id}\` claimed by <@${interaction.user.id}>`,
				color: 0x00ff00
			}
		]
	});
};
